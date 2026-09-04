import { describe, expect, it, vi } from 'vitest'
import { showmo, showmoRules } from '../src/index.js'
import { el } from './helpers.js'

function hidden (elm) {
  return elm.getAttribute('data-showmo-state') === 'hidden'
}

describe('cascade', () => {
  it('showmo() cascades: value of a hidden source does not count', () => {
    el(`
      <input type="checkbox" name="pet" value="1" checked>
      <div id="b" data-showmo="pet"><select name="type"><option value="dog" selected>dog</option></select></div>
      <div id="c" data-showmo='type === "dog"'>breed</div>
    `)
    const c = showmo('[data-showmo]', { onload: true })
    expect(hidden(document.getElementById('b'))).toBe(false)
    expect(hidden(document.getElementById('c'))).toBe(false)

    document.querySelector('[name="pet"]').checked = false
    document.querySelector('[name="pet"]').dispatchEvent(new Event('change', { bubbles: true }))

    expect(hidden(document.getElementById('b'))).toBe(true)
    expect(hidden(document.getElementById('c'))).toBe(true)
    c.destroy()
  })

  it('treats the standard hidden attribute as hidden', () => {
    el(`
      <div hidden><input name="k" value="yes"></div>
      <div id="t" data-showmo='k === "yes"'>x</div>
    `)
    const c = showmo('[data-showmo]')
    expect(hidden(document.getElementById('t'))).toBe(true)
    c.destroy()
  })

  it('showmoRules() still cascades', () => {
    el(`
      <input type="checkbox" name="pet" value="1">
      <div id="b"><input name="type" value="dog"></div>
      <div id="c">breed</div>
    `)
    const c = showmoRules([
      { target: '#b', when: 'pet' },
      { target: '#c', when: 'type === "dog"' }
    ])
    expect(hidden(document.getElementById('b'))).toBe(true)
    expect(hidden(document.getElementById('c'))).toBe(true)
    c.destroy()
  })
})

describe('parse diagnostics', () => {
  it('reports a bad condition through the warn hook', () => {
    el('<div data-showmo="foo &&">x</div>')
    const warn = vi.fn()
    const c = showmo('[data-showmo]', { warn })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('bad condition')
    expect(hidden(document.querySelector('[data-showmo]'))).toBe(true)
    c.destroy()
  })

  it('warns once, not once per pass', () => {
    el('<input name="a" value="1"><div data-showmo="((">x</div>')
    const warn = vi.fn()
    const c = showmo('[data-showmo]', { warn })
    document.querySelector('[name="a"]').dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('[name="a"]').dispatchEvent(new Event('input', { bubbles: true }))
    expect(warn).toHaveBeenCalledTimes(1)
    c.destroy()
  })

  it('a valid condition never warns', () => {
    el('<input name="a" value="1"><div data-showmo=\'a === "1"\'>x</div>')
    const warn = vi.fn()
    const c = showmo('[data-showmo]', { warn })
    expect(warn).not.toHaveBeenCalled()
    expect(hidden(document.querySelector('[data-showmo]'))).toBe(false)
    c.destroy()
  })
})
