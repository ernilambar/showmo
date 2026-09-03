import { describe, expect, it, vi } from 'vitest'
import { showmo } from '../src/index.js'
import { el } from './helpers.js'

describe('effects', () => {
  it('hidden sets display:none + aria-hidden + state', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    const t = document.getElementById('t')
    expect(t.style.display).toBe('none')
    expect(t.getAttribute('aria-hidden')).toBe('true')
    expect(t.getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('show restores original display', () => {
    el('<input type="text" id="c" value="NP"><div id="t" style="display: flex">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    const t = document.getElementById('t')
    expect(t.style.display).toBe('flex')
    expect(t.getAttribute('data-showmo-state')).toBe('shown')
    document.getElementById('c').value = 'US'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(t.style.display).toBe('none')
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(t.style.display).toBe('flex')
    c.destroy()
  })

  it('disable only touches what it disabled', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t"><input id="i1" type="text"><input id="i2" type="text" disabled></div>`)
    const cc = showmo('#t', { when: '#c', is: 'NP', disableWhenHidden: true })
    const i1 = document.getElementById('i1')
    const i2 = document.getElementById('i2')
    expect(i1.disabled).toBe(true)
    expect(i2.disabled).toBe(true)
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(i1.disabled).toBe(false)
    expect(i2.disabled).toBe(true)
    cc.destroy()
  })

  it('clear dispatches change', async () => {
    el(`<input type="text" id="c" value="US">
      <div id="t"><input id="i1" type="text" value="hello"><input id="chk" type="checkbox" checked value="v"></div>`)
    const seen = []
    document.getElementById('i1').addEventListener('change', () => seen.push('i1'))
    document.getElementById('chk').addEventListener('change', () => seen.push('chk'))
    const c = showmo('#t', { when: '#c', is: 'NP', clearWhenHidden: true })
    expect(document.getElementById('i1').value).toBe('')
    expect(document.getElementById('chk').checked).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(seen).toContain('i1')
    expect(seen).toContain('chk')
    c.destroy()
  })

  it('data-showmo-clear declarative hides + clears while hidden', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t" data-showmo="#c:NP" data-showmo-clear="true"><input id="i1" type="text" value="keep"></div>`)
    const c = showmo('#t')
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe('hidden')
    expect(document.getElementById('i1').value).toBe('')
    c.destroy()
  })

  it('required drops/restores original', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t"><input id="i1" type="text" required><input id="i2" type="text"></div>`)
    const c = showmo('#t', { when: '#c', is: 'NP', requireWhenVisible: true })
    expect(document.getElementById('i1').required).toBe(false)
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('i1').required).toBe(true)
    expect(document.getElementById('i2').required).toBe(false)
    c.destroy()
  })

  it('custom hiddenClass applied', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP', hiddenClass: 'is-hidden' })
    expect(document.getElementById('t').classList.contains('is-hidden')).toBe(true)
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('t').classList.contains('is-hidden')).toBe(false)
    c.destroy()
  })

  it('ifTrue/ifFalse custom functions and arrays', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const order = []
    const c = showmo('#t', {
      when: '#c',
      is: 'NP',
      ifFalse: ['hide', (elm) => order.push('custom-hide:' + elm.id)],
      ifTrue: [(elm) => order.push('custom-show:' + elm.id), 'show']
    })
    expect(order).toEqual(['custom-hide:t'])
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(order).toEqual(['custom-hide:t', 'custom-show:t'])
    c.destroy()
  })

  it('action names enable/disable via ifTrue/ifFalse', () => {
    el('<input type="text" id="c" value="US"><div id="t"><input id="i1" type="text"></div>')
    const c = showmo('#t', { when: '#c', is: 'NP', ifFalse: ['hide', 'disable'], ifTrue: ['show', 'enable'] })
    expect(document.getElementById('i1').disabled).toBe(true)
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('i1').disabled).toBe(false)
    c.destroy()
  })

  it('ignore action leaves target untouched', () => {
    el('<input type="text" id="c" value="US"><div id="t" style="display:block">hi</div>')
    const spy = vi.fn()
    document.getElementById('t').addEventListener('showmo:show', spy)
    const c = showmo('#t', { when: '#c', is: 'NP', ifFalse: 'ignore' })
    expect(document.getElementById('t').style.display).toBe('block')
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(spy).toHaveBeenCalledTimes(1)
    c.destroy()
  })

  it('pre-hidden (hidden attr) target shows when condition matches', () => {
    el('<input type="text" id="c" value="NP"><div id="t" hidden>hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    const t = document.getElementById('t')
    expect(t.hasAttribute('hidden')).toBe(false)
    expect(t.getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })

  it('pre-hidden (hidden attr) target stays hidden when condition misses', () => {
    el('<input type="text" id="c" value="US"><div id="t" hidden>hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    const t = document.getElementById('t')
    expect(t.getAttribute('data-showmo-state')).toBe('hidden')
    expect(t.style.display).toBe('none')
    c.destroy()
  })

  it('hidden attr removed on show with animate preset', () => {
    el('<input type="text" id="c" value="NP"><div id="t" hidden>hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP', animate: 'fade' })
    const t = document.getElementById('t')
    expect(t.hasAttribute('hidden')).toBe(false)
    expect(t.getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })

  it('hide of style="display:none" target restores to visible on show', () => {
    el('<input type="text" id="c" value="US"><div id="t" style="display:none">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    expect(document.getElementById('t').style.display).toBe('none')
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    const t = document.getElementById('t')
    expect(t.style.display).not.toBe('none')
    expect(t.getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })
})
