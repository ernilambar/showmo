import { afterEach, beforeEach, describe, expect, it } from 'vitest'

let root

beforeEach(() => {
  root = document.createElement('div')
  document.body.appendChild(root)
})

afterEach(() => {
  root.remove()
  document.body.innerHTML = ''
  delete window.showmoConfig
})

export function el (html) {
  root.innerHTML = html
  return root
}

export function src (scope) {
  return (name) => {
    const els = root.querySelectorAll(`[data-t="${name}"]`)
    if (!els.length) return undefined
    if (els.length === 1) return fieldValue(els[0])
    return Array.from(els).map(fieldValue)
  }
}

function fieldValue (elm) {
  if (elm.type === 'checkbox') return elm.checked ? elm.value : false
  if (elm.type === 'radio') return elm.checked ? elm.value : undefined
  if (elm.tagName === 'SELECT' && elm.multiple) {
    return Array.from(elm.selectedOptions).map((o) => o.value)
  }
  return elm.value
}

export function docSrc (name) {
  const els = Array.from(document.querySelectorAll(`[name="${name}"]`))
  if (!els.length) {
    try {
      const q = Array.from(document.querySelectorAll(name))
      if (!q.length) return undefined
      if (q.length === 1) return fieldValue(q[0])
      return q.map(fieldValue)
    } catch (e) {
      return undefined
    }
  }
  if (els.length === 1) return fieldValue(els[0])
  return els.map(fieldValue)
}

export function flush () {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export { root as getRoot }

describe('helpers', () => {
  it('mounts fixtures', () => {
    el('<input data-t="a" value="x">')
    expect(src()('a')).toBe('x')
  })
})
