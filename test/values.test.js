import { describe, expect, it } from 'vitest'
import { getValue } from '../src/values.js'
import { el } from './helpers.js'

describe('values', () => {
  it('checkbox checked/unchecked', () => {
    el('<input type="checkbox" id="cb" value="yes" checked>')
    expect(getValue('#cb')).toBe('yes')
    document.getElementById('cb').checked = false
    expect(getValue('#cb')).toBe(false)
  })

  it('radio group checked/none', () => {
    el('<input type="radio" name="pick" value="a"><input type="radio" name="pick" value="b" checked>')
    expect(getValue('pick')).toBe('b')
    document.querySelectorAll('[name="pick"]').forEach((r) => { r.checked = false })
    expect(getValue('pick')).toBe(undefined)
  })

  it('single select', () => {
    el('<select id="s"><option value="US">US</option><option value="NP" selected>NP</option></select>')
    expect(getValue('#s')).toBe('NP')
  })

  it('multi-select array', () => {
    el(`<select id="m" multiple>
      <option value="a" selected>a</option><option value="b">b</option><option value="c" selected>c</option>
    </select>`)
    expect(getValue('#m')).toEqual(['a', 'c'])
  })

  it('text, textarea and bracket names', () => {
    el(`<input type="text" id="t" value="hi">
      <textarea id="ta">hello</textarea>
      <input type="text" name="foo[bar]" value="baz">
      <input type="checkbox" name="tags[]" value="x" checked>
      <input type="checkbox" name="tags[]" value="y" checked>`)
    expect(getValue('#t')).toBe('hi')
    expect(getValue('#ta')).toBe('hello')
    expect(getValue('foo[bar]')).toBe('baz')
    expect(getValue('tags[]')).toEqual(['x', 'y'])
  })

  it('missing element is undefined', () => {
    el('<input type="text" id="t" value="hi">')
    expect(getValue('#missing')).toBe(undefined)
    expect(getValue('missing-name')).toBe(undefined)
  })
})
