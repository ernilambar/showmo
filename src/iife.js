import './showmo.css'
import { showmo, showmoRules, autoInit } from './showmo.js'
import { getValue } from './values.js'

function ready (fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true })
  } else {
    fn()
  }
}

ready(autoInit)

globalThis.showmo = { showmo, showmoRules, autoInit, getValue }
