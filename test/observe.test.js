import { describe, expect, it, vi } from 'vitest'
import { showmo } from '../src/showmo.js'
import { el, flush, docSrc } from './helpers.js'

describe('observe', () => {
  it('picks up targets added after init', async () => {
    const root = el('<input name="flag" value="yes"><div id="host"></div>')
    const c = showmo('[data-showmo]', { observe: true })
    root.querySelector('#host').innerHTML = '<div data-showmo="flag:yes" id="late">late</div>'
    await flush()
    expect(root.querySelector('#late').getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })

  it('leaves added targets alone without observe', async () => {
    const root = el('<input name="flag" value="yes"><div id="host"></div>')
    const c = showmo('[data-showmo]', {})
    root.querySelector('#host').innerHTML = '<div data-showmo="flag:no" id="late">late</div>'
    await flush()
    expect(root.querySelector('#late').getAttribute('data-showmo-state')).toBe(null)
    c.refresh()
    expect(root.querySelector('#late').getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('stops observing after destroy', async () => {
    const root = el('<input name="flag" value="yes"><div id="host"></div>')
    const c = showmo('[data-showmo]', { observe: true })
    c.destroy()
    root.querySelector('#host').innerHTML = '<div data-showmo="flag:yes" id="late">late</div>'
    await flush()
    expect(root.querySelector('#late').getAttribute('data-showmo-state')).toBe(null)
  })
})

describe('non-settling conditions', () => {
  it('warns once when passes never settle', () => {
    const root = el('<input name="toggle" value="on"><div data-showmo="toggle" id="t">x</div>')
    const field = root.querySelector('[name="toggle"]')
    const warn = vi.fn()
    const c = showmo('#t', {
      warn,
      ifTrue: () => { field.value = '' },
      ifFalse: () => { field.value = 'on' }
    })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/did not settle/)
    field.dispatchEvent(new Event('change', { bubbles: true }))
    expect(warn).toHaveBeenCalledTimes(1)
    c.destroy()
  })

  it('does not warn for conditions that settle', () => {
    el('<input name="flag" value="yes"><div data-showmo="flag:yes" id="t">x</div>')
    const warn = vi.fn()
    const c = showmo('#t', { warn })
    expect(docSrc('flag')).toBe('yes')
    expect(warn).not.toHaveBeenCalled()
    c.destroy()
  })
})
