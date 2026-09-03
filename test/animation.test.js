import { describe, expect, it, vi } from 'vitest'
import { showmo } from '../src/index.js'
import { el } from './helpers.js'

describe('animation', () => {
  it('default has no preset class + inline display', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP' })
    const t = document.getElementById('t')
    expect(t.className).not.toMatch(/showmo-(fade|slide|pop)/)
    expect(t.style.display).toBe('none')
    c.destroy()
  })

  it.each(['fade', 'slide', 'pop'])('animate:%s applies class, no inline display', (preset) => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP', animate: preset })
    const t = document.getElementById('t')
    expect(t.classList.contains('showmo-' + preset)).toBe(true)
    expect(t.style.display).not.toBe('none')
    expect(t.getAttribute('aria-hidden')).toBe('true')
    expect(t.getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('unknown preset name falls back to instant', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP', animate: 'zoom' })
    const t = document.getElementById('t')
    expect(t.className).not.toMatch(/showmo-(fade|slide|pop|zoom)/)
    expect(t.style.display).toBe('none')
    c.destroy()
  })

  it('data-showmo-animate declarative opts in', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t" data-showmo="#c:NP" data-showmo-animate="fade">hi</div>`)
    const c = showmo('#t')
    expect(document.getElementById('t').classList.contains('showmo-fade')).toBe(true)
    c.destroy()
  })

  it('first run suppresses transitions', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const c = showmo('#t', { when: '#c', is: 'NP', animate: 'fade' })
    expect(document.getElementById('t').classList.contains('showmo-no-motion')).toBe(true)
    document.getElementById('c').value = 'NP'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('t').classList.contains('showmo-no-motion')).toBe(false)
    document.getElementById('c').value = 'US'
    document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
    expect(document.getElementById('t').classList.contains('showmo-no-motion')).toBe(false)
    c.destroy()
  })

  it('reduced-motion collapses to instant (no-motion class)', () => {
    const orig = window.matchMedia
    window.matchMedia = vi.fn(() => ({ matches: true }))
    try {
      el('<input type="text" id="c" value="NP"><div id="t">hi</div>')
      const c = showmo('#t', { when: '#c', is: 'NP', animate: 'fade' })
      expect(document.getElementById('t').classList.contains('showmo-no-motion')).toBe(true)
      document.getElementById('c').value = 'US'
      document.getElementById('c').dispatchEvent(new Event('change', { bubbles: true }))
      expect(document.getElementById('t').classList.contains('showmo-no-motion')).toBe(true)
      c.destroy()
    } finally {
      window.matchMedia = orig
    }
  })
})
