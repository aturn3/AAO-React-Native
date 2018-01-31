/**
 * @flow
 * updateStoredCourses() handles updating the cached course data from the server
 */

import type {CourseType, TermType} from './types'
import {COURSE_DATA_PAGE, INFO_PAGE, COURSE_STORAGE_DIR, TERMS_FILE} from './urls'
import RNFS from 'react-native-fs'

type TermInfoType = {
 files: Array<TermType>,
 type: string,
}

export async function updateStoredCourses(): boolean {
  RNFS.readDir(COURSE_STORAGE_DIR + '/terms')
    .catch(() => {
      RNFS.mkdir(COURSE_STORAGE_DIR + '/terms')
    })
  const outdatedTerms : Array<TermType> = await determineOutdatedTerms()
  outdatedTerms.forEach(term => {
    storeTermCoursesFromServer(term.path)
  })
  return outdatedTerms.length === 0 ? false : true
}

async function loadCurrentTermsFromServer(): Array<TermType> {
   try {
     const today = new Date()
     const thisYear = today.getFullYear()
     const resp : TermInfoType = await fetchJson(INFO_PAGE)
     const terms : Array<TermType> = resp.files.filter(
       file => file.type === "json" && file.year > (thisYear-5)
     )
     return terms
   } catch(error) {
     console.log(error)
   }
 }

export async function loadTermsFromStorage(): Array<TermType> {
  return (
    RNFS.readFile(TERMS_FILE)
      .then(contents => {
        const localTerms : Array<TermType> = JSON.parse(contents)
        return localTerms
      })
      .catch(error => {
        return []
      })
  )
}

async function determineOutdatedTerms(): Array<TermType> {
  const remoteTerms : Array<TermType> = await loadCurrentTermsFromServer()
  const localTerms : Array<TermType> = await loadTermsFromStorage()
  if (localTerms.length === 0) {
    storeTermInfo(remoteTerms)
    return remoteTerms
  }
  let outdatedTerms = localTerms.filter(
   localTerm => localTerm.hash != remoteTerms.find(remoteTerm => remoteTerm.term === localTerm.term).hash
  )
  if (outdatedTerms.length !== 0) {
    storeTermInfo(remoteTerms)
  }
  return outdatedTerms
}

function storeTermInfo(terms: Array<TermType>) {
  let json = JSON.stringify(terms)
  RNFS.writeFile(TERMS_FILE, json, 'utf8')
}

async function storeTermCoursesFromServer(
 path: string,
): boolean {

  const url = COURSE_DATA_PAGE + path

  try {
   const resp : Array<CourseType> = await fetchJson(url)
   const courseJson = JSON.stringify(resp)
   const filePath = COURSE_STORAGE_DIR + path
   RNFS.writeFile(filePath, courseJson, 'utf8')
    .then((success) => {
      console.log('FILE WRITTEN!')
      return true
    })
    .catch((err) => {
      return false
    });
  } catch(error) {
   console.log(error)
   return false
  }
}