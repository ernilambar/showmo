import { describe, expect, it } from 'vitest'
import { testCondition } from '../src/parse.js'
import { el, src } from './helpers.js'

function t (expr) {
  return testCondition(expr, (s) => src()(s.replace(/^#/, '')))
}

describe('shorthand', () => {
  it('truthy source: checked checkbox, filled text, selected option', () => {
    el(`<input type="checkbox" data-t="nl" value="yes" checked>
      <input type="text" data-t="name" value="Ada">
      <select data-t="country"><option value="">-</option><option value="NP" selected>NP</option></select>`)
    expect(t('#nl')).toBe(true)
    expect(t('#name')).toBe(true)
    expect(t('#country')).toBe(true)
  })

  it('falsy source: unchecked checkbox, empty text', () => {
    el(`<input type="checkbox" data-t="nl" value="yes">
      <input type="text" data-t="name" value="">`)
    expect(t('#nl')).toBe(false)
    expect(t('#name')).toBe(false)
    expect(t('!#nl')).toBe(true)
    expect(t('!#name')).toBe(true)
  })

  it('source:value equality', () => {
    el('<input type="text" data-t="country" value="NP">')
    expect(t('#country:NP')).toBe(true)
    expect(t('#country:US')).toBe(false)
  })

  it('source:!value inequality', () => {
    el('<input type="text" data-t="country" value="NP">')
    expect(t('#country:!US')).toBe(true)
    expect(t('#country:!NP')).toBe(false)
  })

  it('source:a,b,c any-of', () => {
    el('<input type="text" data-t="country" value="IN">')
    expect(t('#country:NP,IN,BT')).toBe(true)
    expect(t('#country:NP,US')).toBe(false)
  })

  it('quoted values with spaces', () => {
    el('<input type="text" data-t="city" value="New York">')
    expect(t('#city:"New York"')).toBe(true)
    expect(t("#city:'Boston'")).toBe(false)
  })

  it('number, boolean and null literals', () => {
    el(`<input type="text" data-t="age" value="21">
      <input type="text" data-t="flag" value="true">`)
    expect(t('#age:21')).toBe(true)
    expect(t('#age:22')).toBe(false)
    expect(t('#flag:true')).toBe(true)
    expect(t('#flag:false')).toBe(false)
    expect(testCondition('#x:null', () => null)).toBe(true)
    expect(testCondition('#x:null', () => 'NP')).toBe(false)
  })

  it('&&, || and parens precedence', () => {
    el(`<input type="text" data-t="a" value="1">
      <input type="text" data-t="b" value="no">
      <input type="text" data-t="c" value="3">`)
    expect(t('#a:1 && #b:2 || #c:3')).toBe(true)
    expect(t('#a:9 && (#b:2 || #c:3)')).toBe(false)
    expect(t('(#a:1 || #b:2) && #c:3')).toBe(true)
    expect(t('!#a:1 || #c:3')).toBe(true)
  })

  it('unknown selector is false', () => {
    el('<input type="text" data-t="a" value="1">')
    expect(t('#nope')).toBe(false)
    expect(t('#nope:x')).toBe(false)
    expect(t('!#nope')).toBe(true)
    expect(t('#nope && #a:1')).toBe(false)
  })
})
