import './showmo.css'
import { showmo, showmoRules, initAll } from './showmo.js'
import { getValue } from './values.js'

function ready (fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true })
  } else {
    fn()
  }
}

ready(initAll)

globalThis.showmo = { showmo, showmoRules, initAll, getValue }
