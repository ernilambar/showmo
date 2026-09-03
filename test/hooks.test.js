import { describe, expect, it, vi } from 'vitest'
import { showmo } from '../src/index.js'
import { el } from './helpers.js'

function fire (id, value) {
  const src = document.getElementById(id)
  src.value = value
  src.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('hooks', () => {
  it('show/hide/init fire with detail.target', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const got = []
    document.getElementById('t').addEventListener('showmo:init', (e) => got.push(['init', e.detail.target.id, e.detail.firstRun]))
    document.getElementById('t').addEventListener('showmo:show', (e) => got.push(['show', e.detail.target.id, e.detail.firstRun]))
    document.getElementById('t').addEventListener('showmo:hide', (e) => got.push(['hide', e.detail.target.id, e.detail.firstRun]))
    const c = showmo('#t', { when: '#c', is: 'NP' })
    expect(got).toEqual([['init', 't', true]])
    fire('c', 'NP')
    expect(got[1]).toEqual(['show', 't', false])
    fire('c', 'US')
    expect(got[2]).toEqual(['hide', 't', false])
    c.destroy()
  })

  it('events fire only on transitions', () => {
    el('<input type="text" id="c" value="NP"><div id="t">hi</div>')
    let shows = 0
    let hides = 0
    document.getElementById('t').addEventListener('showmo:show', () => shows++)
    document.getElementById('t').addEventListener('showmo:hide', () => hides++)
    const c = showmo('#t', { when: '#c', is: 'NP' })
    fire('c', 'NP')
    fire('c', 'NP')
    expect(shows).toBe(0)
    expect(hides).toBe(0)
    fire('c', 'US')
    fire('c', 'US')
    expect(hides).toBe(1)
    c.destroy()
  })

  it('onShow/onHide arrays run in order', () => {
    el('<input type="text" id="c" value="US"><div id="t">hi</div>')
    const order = []
    const c = showmo('#t', {
      when: '#c',
      is: 'NP',
      onHide: [(elm) => order.push('h1:' + elm.id), (elm) => order.push('h2:' + elm.id)],
      onShow: [(elm) => order.push('s1:' + elm.id), (elm) => order.push('s2:' + elm.id)]
    })
    expect(order).toEqual([])
    fire('c', 'NP')
    expect(order).toEqual(['s1:t', 's2:t'])
    fire('c', 'US')
    expect(order).toEqual(['s1:t', 's2:t', 'h1:t', 'h2:t'])
    c.destroy()
  })

  it('data-showmo-onshow resolves dotted global', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t" data-showmo="#c:NP" data-showmo-onshow="myApp.refresh">hi</div>`)
    const seen = []
    window.myApp = { refresh: (elm) => seen.push(elm.id) }
    try {
      const c = showmo('#t')
      fire('c', 'NP')
      expect(seen).toEqual(['t'])
      c.destroy()
    } finally {
      delete window.myApp
    }
  })

  it('missing global warns, does not throw', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t" data-showmo="#c:NP" data-showmo-onshow="nope.missing">hi</div>`)
    const warn = vi.fn()
    const orig = console.warn
    console.warn = warn
    try {
      const c = showmo('#t', { warn: (m) => warn(m) })
      expect(() => fire('c', 'NP')).not.toThrow()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('nope.missing'))
      c.destroy()
    } finally {
      console.warn = orig
    }
  })

  it('refreshOnShow dispatches change on descendants', () => {
    el(`<input type="text" id="c" value="US">
      <div id="t"><input id="inner" type="text" value="x"></div>`)
    const seen = []
    document.getElementById('inner').addEventListener('change', () => seen.push('inner'))
    const c = showmo('#t', { when: '#c', is: 'NP', refreshOnShow: true })
    expect(seen).toEqual([])
    fire('c', 'NP')
    expect(seen).toEqual(['inner'])
    c.destroy()
  })
})
