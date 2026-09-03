import { describe, expect, it } from 'vitest'
import { testCondition } from '../src/parse.js'
import { el, src } from './helpers.js'

function t (expr) {
  return testCondition(expr, (s) => src()(s.replace(/^#/, '')))
}

describe('expression', () => {
  it.each([
    ['#a === "x"', true],
    ['#a === "y"', false],
    ['#a !== "y"', true],
    ['#a !== "x"', false],
    ['#a == "x"', true],
    ['#a == "y"', false],
    ['#a != "y"', true],
    ['#a != "x"', false]
  ])('%s -> %s', (expr, want) => {
    el('<input type="text" data-t="a" value="x">')
    expect(t(expr)).toBe(want)
  })

  it.each([
    ['#n > 18', true],
    ['#n > 21', false],
    ['#n < 30', true],
    ['#n < 21', false],
    ['#n >= 21', true],
    ['#n >= 22', false],
    ['#n <= 21', true],
    ['#n <= 20', false]
  ])('%s -> %s', (expr, want) => {
    el('<input type="text" data-t="n" value="21">')
    expect(t(expr)).toBe(want)
  })

  it('mixes shorthand with operators', () => {
    el(`<input type="text" data-t="country" value="NP">
      <input type="text" data-t="age" value="21">
      <input type="checkbox" data-t="nl" value="yes" checked>`)
    expect(t('#country:NP && #age >= 18')).toBe(true)
    expect(t('#country:US || (#age > 18 && #nl)')).toBe(true)
    expect(t('#country:NP && #age < 18')).toBe(false)
  })

  it('string and number literals', () => {
    el('<input type="text" data-t="n" value="5">')
    expect(t('#n === 5')).toBe(true)
    expect(t('#n === "5"')).toBe(true)
    expect(t("#n === '6'")).toBe(false)
  })

  it('method calls are false without throwing', () => {
    el('<input type="text" data-t="country" value="NP">')
    expect(() => t('#country.includes("N")')).not.toThrow()
    expect(t('#country.includes("N")')).toBe(false)
    expect(() => t('#country === "NP" && #list.every(x => x)')).not.toThrow()
    expect(t('#country === "NP" && #list.every(x => x)')).toBe(false)
  })

  it('unbalanced parens are false', () => {
    el('<input type="text" data-t="a" value="1">')
    expect(t('(#a:1')).toBe(false)
    expect(t('#a:1)')).toBe(false)
    expect(t('')).toBe(true)
  })
})
