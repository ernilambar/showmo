import { describe, expect, it } from 'vitest'
import { showmo, showmoRules } from '../src/index.js'
import { testCondition } from '../src/parse.js'
import { el } from './helpers.js'

describe('adapters', () => {
  it('optioner emitted strings parse correctly (slug[key] is v)', () => {
    el('<input type="text" name="slug[key]" value="v">')
    const get = (src) => {
      const els = document.querySelectorAll(`[name="${src}"]`)
      if (!els.length) return undefined
      return els[0].value
    }
    expect(testCondition('slug[key] === "v"', get)).toBe(true)
    expect(testCondition('slug[key] === "other"', get)).toBe(false)
  })

  it('optioner id form: #slug---key and negation with && chains', () => {
    el(`<input type="text" id="slug---color" value="red">
      <input type="text" id="slug---size" value="xl">`)
    const get = (src) => {
      const elm = document.querySelector(src)
      return elm ? elm.value : undefined
    }
    expect(testCondition('#slug---color === "red"', get)).toBe(true)
    expect(testCondition('!#slug---color', get)).toBe(false)
    expect(testCondition('!#slug---missing', get)).toBe(true)
    expect(testCondition('#slug---color:red && #slug---size:xl', get)).toBe(true)
    expect(testCondition('#slug---color:blue && #slug---size:xl', get)).toBe(false)
  })

  it('optiz rule shape converts to selector rules identically', () => {
    el(`<input type="text" name="opt[country]" value="NP">
      <div data-field-id="city-row"></div>
      <div data-field-id="other-row"></div>`)
    const optizRules = [
      { fieldId: 'city-row', conditions: [{ field: 'country', compare: '===', value: 'NP' }] },
      { fieldId: 'other-row', conditions: [{ field: 'country', compare: '!==', value: 'NP' }] }
    ]
    const toCheck = (cc) => cc.compare === '!=='
      ? { source: `[name$="[${cc.field}]"]`, isNot: cc.value }
      : { source: `[name$="[${cc.field}]"]`, is: cc.value }
    const c = showmoRules(optizRules.map((r) => ({
      target: `[data-field-id="${r.fieldId}"]`,
      when: r.conditions.map(toCheck)
    })))
    expect(document.querySelector('[data-field-id="city-row"]').getAttribute('data-showmo-state')).toBe('shown')
    expect(document.querySelector('[data-field-id="other-row"]').getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('optioner truthiness chains via showmo()', () => {
    el(`<input type="checkbox" id="slug---nl" value="yes" checked>
      <input type="text" id="slug---name" value="Ada">
      <div id="row"></div>`)
    const c = showmo('#row', { when: '#slug---nl && #slug---name:Ada' })
    expect(document.getElementById('row').getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })
})
