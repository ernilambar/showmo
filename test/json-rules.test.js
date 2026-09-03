import { describe, expect, it } from 'vitest'
import { showmo, showmoRules } from '../src/index.js'
import { el, flush } from './helpers.js'

describe('json-rules', () => {
  it('is / isNot / oneOf / bare truthy', () => {
    el(`<input type="text" id="country" value="NP">
      <input type="text" id="x" value="1">
      <input type="text" id="empty" value="">
      <div id="a"></div><div id="b"></div><div id="c"></div><div id="d"></div>`)
    const c = showmoRules([
      { target: '#a', when: [{ source: '#country', is: 'NP' }] },
      { target: '#b', when: [{ source: '#country', isNot: 'US' }] },
      { target: '#c', when: [{ source: '#country', oneOf: ['NP', 'IN'] }] },
      { target: '#d', when: [{ source: '#empty' }] }
    ])
    expect(document.getElementById('a').style.display).not.toBe('none')
    expect(document.getElementById('b').style.display).not.toBe('none')
    expect(document.getElementById('c').style.display).not.toBe('none')
    expect(document.getElementById('d').style.display).toBe('none')
    c.destroy()
  })

  it('inline data-showmo-rules + data-showmo-target via auto-init path', () => {
    el(`<input type="text" id="country" value="US">
      <div id="row" data-showmo-rules='[{"source":"#country","is":"NP"}]'></div>
      <div id="other"></div>
      <div id="via" data-showmo-rules='[{"source":"#country","is":"US"}]' data-showmo-target="#other"></div>`)
    const c = showmoRules([
      { target: document.getElementById('row'), when: JSON.parse(document.getElementById('row').getAttribute('data-showmo-rules')) },
      { target: document.getElementById('via').getAttribute('data-showmo-target'), when: JSON.parse(document.getElementById('via').getAttribute('data-showmo-rules')) }
    ])
    expect(document.getElementById('row').getAttribute('data-showmo-state')).toBe('hidden')
    expect(document.getElementById('other').getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })

  it('unknown op falls back to ===', () => {
    el('<input type="text" id="country" value="NP"><div id="a"></div>')
    const c = showmoRules([{ target: '#a', when: [{ source: '#country', op: 'wat', value: 'NP' }] }])
    expect(document.getElementById('a').getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })

  it('cascade: hidden source hides dependent', () => {
    el(`<input type="checkbox" id="master" value="1" checked>
      <div id="wrap"><input type="text" id="inner" value="NP"></div>
      <div id="dep"></div>`)
    const c1 = showmo('#wrap', { when: '#nope', is: 'x' })
    expect(document.getElementById('wrap').getAttribute('data-showmo-state')).toBe('hidden')
    const c2 = showmoRules([{ target: '#dep', when: [{ source: '#inner', is: 'NP' }] }])
    expect(document.getElementById('dep').getAttribute('data-showmo-state')).toBe('hidden')
    c1.destroy()
    c2.destroy()
  })

  it('chained fixpoint A→B→C settles', async () => {
    el(`<input type="text" id="a" value="go">
      <div id="b"><input type="text" id="bv" value="mid"></div>
      <div id="c"></div>`)
    const c = showmoRules([
      { target: '#b', when: [{ source: '#a', is: 'go' }] },
      { target: '#c', when: [{ source: '#bv', is: 'mid' }] }
    ])
    expect(document.getElementById('b').getAttribute('data-showmo-state')).toBe('shown')
    expect(document.getElementById('c').getAttribute('data-showmo-state')).toBe('shown')
    document.getElementById('a').value = 'stop'
    document.getElementById('a').dispatchEvent(new Event('change', { bubbles: true }))
    await flush()
    expect(document.getElementById('b').getAttribute('data-showmo-state')).toBe('hidden')
    expect(document.getElementById('c').getAttribute('data-showmo-state')).toBe('hidden')
    c.destroy()
  })

  it('showmo shorthand object when/is form', () => {
    el('<input type="text" id="country" value="NP"><div id="extra"></div>')
    const c = showmo('#extra', { when: '#country', is: 'NP' })
    expect(document.getElementById('extra').getAttribute('data-showmo-state')).toBe('shown')
    c.destroy()
  })
})
