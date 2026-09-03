import { describe, expect, it } from 'vitest'
import { initAll, showmo } from '../src/index.js'
import { el } from './helpers.js'

describe('lifecycle', () => {
  it('auto-init picks up [data-showmo] without an API call', () => {
    el(`<input type="text" id="c" value="NP">
      <div id="t" data-showmo="#c:NP">hi</div>`)
    initAll()
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe('shown')
    document.getElementById('t').removeAttribute('data-showmo-init')
  })

  it('double-init guard: second init does not duplicate or throw', () => {
    el(`<input type="text" id="c" value="NP">
      <div id="t" data-showmo="#c:NP">hi</div>`)
    const a = showmo('#t')
    const b = showmo('#t')
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe('shown')
    a.destroy()
    b.destroy()
  })

  it('onload:false skips initial eval', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP', onload: false })
    expect(document.getElementById('t').hasAttribute('data-showmo-state')).toBe(false)
    c.refresh()
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('delegated change + input re-evaluate', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    const src = document.getElementById('c')
    src.value = 'NP'
    src.dispatchEvent(new Event('input', { bubbles: true }))
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe('shown')
    src.value = 'US'
    src.dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('refresh() picks up dynamic markup', () => {
    el('<input type="text" id="c" value="NP"><div id="t" data-x="1">hi</div>')
    const c = showmo('[data-x]')
    const late = document.createElement('div')
    late.id = 'late'
    late.setAttribute('data-x', '1')
    document.body.appendChild(late)
    c.refresh()
    expect(document.getElementById('late').getAttribute('data-showmo-state')).toBe('shown')
    late.remove()
    c.destroy()
  })

  it('destroy() stops updates', () => {
    el('<input type="text" id="c" value="NP"><div id="t" data-showmo="#c:NP">hi</div>')
    const c = showmo('#t')
    c.destroy()
    document.getElementById('c').value = 'US'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('t').getAttribute('data-showmo-state')).toBe(null)
  })

  it('destroy() restores elements to their original state', () => {
    el('<input type="text" id="c" value="US"><div id="t" data-showmo="#c:NP" data-showmo-disable="true" data-showmo-require="true"><input id="f" required></div>')
    const c = showmo('#t')
    const t = document.getElementById('t')
    const f = document.getElementById('f')
    expect(t.getAttribute('data-showmo-state')).toBe('hidden')
    expect(f.disabled).toBe(true)
    expect(f.required).toBe(false)
    c.destroy()
    expect(t.getAttribute('data-showmo-state')).toBe(null)
    expect(t.getAttribute('aria-hidden')).toBe(null)
    expect(t.style.display).toBe('')
    expect(f.disabled).toBe(false)
    expect(f.required).toBe(true)
  })

  it('option precedence: attrs > call > window.showmoConfig > defaults', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t" data-showmo="#c:NP" data-showmo-class="attr-class">hi</div>`)
    window.showmoConfig = { hiddenClass: 'global-class' }
    try {
      const c = showmo('#t', { hiddenClass: 'call-class' })
      expect(document.getElementById('t').classList.contains('attr-class')).toBe(true)
      expect(document.getElementById('t').classList.contains('call-class')).toBe(false)
      c.destroy()

      document.getElementById('t').removeAttribute('data-showmo-class')
      document.getElementById('t').removeAttribute('data-showmo-init')
      const c2 = showmo('#t', { hiddenClass: 'call-class' })
      expect(document.getElementById('t').classList.contains('call-class')).toBe(true)
      c2.destroy()

      document.getElementById('t').removeAttribute('data-showmo-init')
      const c3 = showmo('#t')
      expect(document.getElementById('t').classList.contains('global-class')).toBe(true)
      c3.destroy()
    } finally {
      delete window.showmoConfig
    }
  })
})
