export function escName (name) {
  return String(name).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export function resolveElements (source, root) {
  const doc = root || (typeof document !== 'undefined' ? document : undefined)
  if (!source || !doc) return []
  const key = String(source).trim()
  if (!key) return []
  let found = []
  try {
    found = Array.from(doc.querySelectorAll('[name="' + escName(key) + '"]'))
  } catch (err) {
    found = []
  }
  if (found.length) return found
  try {
    found = Array.from(doc.querySelectorAll(key))
  } catch (err) {
    found = []
  }
  return found
}

function singleValue (el) {
  if (!el || !el.tagName) return undefined
  const type = (el.type || '').toLowerCase()
  if (type === 'checkbox') return el.checked ? el.value : false
  if (type === 'radio') return el.checked ? el.value : undefined
  if (el.tagName.toLowerCase() === 'select' && el.multiple) {
    return Array.from(el.selectedOptions || []).map(function (o) { return o.value })
  }
  return el.value
}

export function listValue (els) {
  if (!els || !els.length) return undefined
  if (els.length === 1) return singleValue(els[0])
  const kinds = els.map(function (el) { return (el.type || el.tagName || '').toLowerCase() })
  if (kinds.every(function (k) { return k === 'radio' })) {
    const checked = els.find(function (el) { return el.checked })
    return checked ? checked.value : undefined
  }
  if (kinds.every(function (k) { return k === 'checkbox' })) {
    return els.filter(function (el) { return el.checked }).map(function (el) { return el.value })
  }
  return els.map(singleValue)
}

export function getValue (source, root) {
  return listValue(resolveElements(source, root))
}

export function isTruthy (value) {
  if (value === undefined || value === null || value === false || value === '') return false
  if (Array.isArray(value)) return value.some(isTruthy)
  return Boolean(value)
}

export function strEqual (actual, expected) {
  if (Array.isArray(actual)) {
    return actual.some(function (a) { return strEqual(a, expected) })
  }
  if (actual === undefined || actual === null) return actual === expected
  if (expected === undefined) return actual === undefined
  return String(actual) === String(expected)
}

export function compareValues (actual, op, expected) {
  if (actual === undefined) return false
  if (Array.isArray(actual)) {
    return actual.some(function (one) { return compareValues(one, op, expected) })
  }
  if (op === '>' || op === '<' || op === '>=' || op === '<=') {
    const a = Number(actual)
    const b = Number(expected)
    if (Number.isNaN(a) || Number.isNaN(b)) return false
    return op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : a <= b
  }
  const eq = strEqual(actual, expected)
  return op === '!==' || op === '!=' ? !eq : eq
}
