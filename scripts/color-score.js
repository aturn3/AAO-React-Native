#!/usr/bin/env node
// from: https://raw.githubusercontent.com/LeaVerou/contrast-ratio/gh-pages/color.js

// Extend Math.round to allow for precision
Math.round = (function() {
  let round = Math.round

  return function(number, decimals) {
    decimals = Number(decimals)

    let multiplier = Math.pow(10, decimals)

    return round(number * multiplier) / multiplier
  }
})()

const Color = class Color {
  constructor(rgba) {
    if (rgba === 'transparent') {
      rgba = [0, 0, 0, 0]
    } else if (typeof rgba === 'string') {
      let rgbaString = rgba
      rgba = rgbaString.match(
        /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/,
      )

      if (rgba) {
        rgba.shift()
      } else {
        throw new Error('Invalid string: ' + rgbaString)
      }
    }

    if (rgba[3] === undefined) {
      rgba[3] = 1
    }

    rgba = rgba.map(function(a) {
      return Math.round(a, 3)
    })

    this.rgba = rgba
  }

  get rgb() {
    return this.rgba.slice(0, 3)
  }

  get alpha() {
    return this.rgba[3]
  }

  set alpha(alpha) {
    this.rgba[3] = alpha
  }

  get luminance() {
    // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    let rgba = this.rgba.slice()

    for (let i = 0; i < 3; i++) {
      let rgb = rgba[i]

      rgb /= 255

      rgb = rgb < 0.03928 ? rgb / 12.92 : Math.pow((rgb + 0.055) / 1.055, 2.4)

      rgba[i] = rgb
    }

    return 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2]
  }

  get inverse() {
    return new Color([
      255 - this.rgba[0],
      255 - this.rgba[1],
      255 - this.rgba[2],
      this.alpha,
    ])
  }

  toString() {
    return (
      'rgb' +
      (this.alpha < 1 ? 'a' : '') +
      '(' +
      this.rgba.slice(0, this.alpha >= 1 ? 3 : 4).join(', ') +
      ')'
    )
  }

  clone() {
    return new Color(this.rgba)
  }

  // Overlay a color over another
  overlayOn(color) {
    let overlaid = this.clone()

    let alpha = this.alpha

    if (alpha >= 1) {
      return overlaid
    }

    for (let i = 0; i < 3; i++) {
      overlaid.rgba[i] =
        overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha)
    }

    overlaid.rgba[3] = alpha + color.rgba[3] * (1 - alpha)

    return overlaid
  }

  contrast(color) {
    // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
    let alpha = this.alpha

    if (alpha >= 1) {
      if (color.alpha < 1) {
        color = color.overlayOn(this)
      }

      let l1 = this.luminance + 0.05,
        l2 = color.luminance + 0.05,
        ratio = l1 / l2

      if (l2 > l1) {
        ratio = 1 / ratio
      }

      ratio = Math.round(ratio, 1)

      return {
        ratio: ratio,
        error: 0,
        min: ratio,
        max: ratio,
      }
    }

    // If we’re here, it means we have a semi-transparent background
    // The text color may or may not be semi-transparent, but that doesn't matter

    let onBlack = this.overlayOn(Color.BLACK),
      onWhite = this.overlayOn(Color.WHITE),
      contrastOnBlack = onBlack.contrast(color).ratio,
      contrastOnWhite = onWhite.contrast(color).ratio

    let max = Math.max(contrastOnBlack, contrastOnWhite)

    // This is here for backwards compatibility and not used to calculate
    // `min`.  Note that there may be other colors with a closer luminance to
    // `color` if they have a different hue than `this`.
    let closest = this.rgb.map(function(c, i) {
      return Math.min(
        Math.max(0, (color.rgb[i] - c * alpha) / (1 - alpha)),
        255,
      )
    })

    closest = new Color(closest)

    let min = 1
    if (onBlack.luminance > color.luminance) {
      min = contrastOnBlack
    } else if (onWhite.luminance < color.luminance) {
      min = contrastOnWhite
    }

    return {
      ratio: Math.round((min + max) / 2, 2),
      error: Math.round((max - min) / 2, 2),
      min: min,
      max: max,
      closest: closest,
      farthest: onWhite == max ? Color.WHITE : Color.BLACK,
    }
  }
}

Color.BLACK = new Color([0, 0, 0])
Color.GRAY = new Color([127.5, 127.5, 127.5])
Color.WHITE = new Color([255, 255, 255])

console.log(Color.BLACK.contrast(Color.WHITE))