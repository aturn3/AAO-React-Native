// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import {CellTextField} from '../../components/cells/textfield'
import {LoginButton} from '../components/login-button'
import {
  logInViaCredentials,
  logOutViaCredentials,
  validateLoginCredentials,
  setLoginCredentials,
  type SettingsState,
} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import noop from 'lodash/noop'

type CredentialsSectionPropsType = {
  username: string,
  password: string,
  loggedIn: boolean,
  message: ?string,

  logIn: (username: string, password: string) => any,
  logOut: () => any,
  validateCredentials: (username: string, password: string) => any,
  setCredentials: (username: string, password: string) => any,
}

class CredentialsLoginSection extends React.Component {
  props: CredentialsSectionPropsType

  _usernameInput: any
  _passwordInput: any

  state = {
    loading: false,
    username: this.props.username,
    password: this.props.password,
  }

  focusUsername = () => this._usernameInput.focus()
  focusPassword = () => this._passwordInput.focus()

  logIn = async () => {
    this.setState({loading: true})
    await this.props.logIn(this.state.username, this.state.password)
    this.setState({loading: false})
  }

  logOut = () => {
    this.props.logOut()
  }

  getUsernameRef = ref => (this._usernameInput = ref)
  getPasswordRef = ref => (this._passwordInput = ref)

  onChangeUsername = (text = '') => this.setState(() => ({username: text}))
  onChangePassword = (text = '') => this.setState(() => ({password: text}))

  render() {
    let {loggedIn, message} = this.props
    let {loading, username, password} = this.state

    return (
      <Section
        header="ST. OLAF LOGIN"
        footer="St. Olaf login enables the &quot;meals remaining&quot; feature."
      >
        <CellTextField
          label="Username"
          _ref={this.getUsernameRef}
          disabled={loading}
          onChangeText={this.onChangeUsername}
          onSubmitEditing={this.focusPassword}
          placeholder="username"
          returnKeyType="next"
          secureTextEntry={false}
          value={username}
        />

        <CellTextField
          label="Password"
          _ref={this.getPasswordRef}
          disabled={loading}
          onChangeText={this.onChangePassword}
          onSubmitEditing={loggedIn ? noop : this.logIn}
          placeholder="password"
          returnKeyType="done"
          secureTextEntry={true}
          value={password}
        />

        {message ? <Cell title={'⚠️ ' + message} /> : null}

        <LoginButton
          loggedIn={loggedIn}
          loading={loading}
          disabled={loading || (!username || !password)}
          onPress={loggedIn ? this.logOut : this.logIn}
          label="St. Olaf"
        />
      </Section>
    )
  }
}

function mapStateToProps(state: {settings: SettingsState}) {
  return {
    initialUsername: state.settings.credentials.username,
    initialPassword: state.settings.credentials.password,
    loginState: state.settings.credentials.state,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    logIn: (u, p) => dispatch(logInViaCredentials(u, p)),
    logOut: () => dispatch(logOutViaCredentials()),
    validateCredentials: (u, p) => dispatch(validateLoginCredentials(u, p)),
    setCredentials: (u, p) => dispatch(setLoginCredentials(u, p)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(
  CredentialsLoginSection,
)
