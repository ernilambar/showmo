import { isTruthy, strEqual, compareValues } from './values.js'

const KNOWN_OPS = ['===', '!==', '==', '!=', '>', '<', '>=', '<=']

function has (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export function matchWhen (entry, get) {
  if (!entry || typeof entry.source !== 'string') return false
  const actual = get(entry.source)
  if (has(entry, 'oneOf') && entry.oneOf !== undefined) {
    if (actual === undefined) return false
    const list = Array.isArray(entry.oneOf) ? entry.oneOf : [entry.oneOf]
    return list.some(function (want) { return strEqual(actual, want) })
  }
  if (has(entry, 'is') && entry.is !== undefined) {
    if (actual === undefined) return false
    return strEqual(actual, entry.is)
  }
  if (has(entry, 'isNot') && entry.isNot !== undefined) {
    if (actual === undefined) return false
    return !strEqual(actual, entry.isNot)
  }
  if (has(entry, 'op') || has(entry, 'value')) {
    const op = KNOWN_OPS.includes(entry.op) ? entry.op : '==='
    return compareValues(actual, op, entry.value)
  }
  return isTruthy(actual)
}
