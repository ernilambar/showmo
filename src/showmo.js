import { getValue, resolveElements } from './values.js'
import { testCondition } from './parse.js'
import { matchWhen } from './rules.js'
import { isPreset, applyVisibility, resetElement, emitInit, emitTransition } from './effects.js'

const DEFAULTS = {
  attr: 'data-showmo',
  onload: true,
  hiddenClass: '',
  disableWhenHidden: false,
  clearWhenHidden: false,
  requireWhenVisible: false,
  animate: false,
  respectReducedMotion: true,
  refreshOnShow: false,
  ifTrue: undefined,
  ifFalse: undefined,
  onShow: undefined,
  onHide: undefined,
  warn: undefined,
  when: undefined,
  is: undefined,
  isNot: undefined,
  oneOf: undefined
}

const INIT = 'data-showmo-init'

function docOf () {
  return typeof document !== 'undefined' ? document : undefined
}

function query (sel) {
  const doc = docOf()
  if (!doc) return []
  try {
    return Array.from(doc.querySelectorAll(sel))
  } catch (err) {
    return []
  }
}

function globalConfig () {
  if (typeof window !== 'undefined' && window.showmoConfig) return window.showmoConfig
  return {}
}

function toElements (targets) {
  const doc = docOf()
  if (!targets || !doc) return []
  if (typeof targets === 'string') return query(targets)
  if (targets.nodeType === 1) return [targets]
  if (typeof targets.length === 'number') {
    try {
      return Array.from(targets).filter(function (el) { return el && el.nodeType === 1 })
    } catch (err) {
      return []
    }
  }
  return []
}

function dataBool (el, name) {
  const raw = el.getAttribute(name)
  if (raw === null) return undefined
  if (raw === '') return true
  const v = raw.trim().toLowerCase()
  return v !== 'false' && v !== '0' && v !== 'no' && v !== 'off'
}

function normalizeAnimate (value) {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return false
  const v = value.trim().toLowerCase()
  if (v === '') return undefined
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
  if (isPreset(v)) return v
  return false
}

function dataOpts (el) {
  const o = {}
  const map = [
    ['data-showmo-disable', 'disableWhenHidden'],
    ['data-showmo-clear', 'clearWhenHidden'],
    ['data-showmo-require', 'requireWhenVisible'],
    ['data-showmo-refresh', 'refreshOnShow']
  ]
  for (const pair of map) {
    const v = dataBool(el, pair[0])
    if (v !== undefined) o[pair[1]] = v
  }
  const cls = el.getAttribute('data-showmo-class')
  if (cls !== null) o.hiddenClass = cls || ''
  const anim = el.getAttribute('data-showmo-animate')
  if (anim !== null) {
    const a = normalizeAnimate(anim)
    if (a !== undefined) o.animate = a
  }
  return o
}

function mergeOpts (options) {
  const base = Object.assign({}, DEFAULTS, globalConfig(), options)
  const a = normalizeAnimate(base.animate)
  base.animate = a === undefined ? false : a
  return base
}

function pickCheck (top) {
  if (top.is !== undefined) return { is: top.is }
  if (top.isNot !== undefined) return { isNot: top.isNot }
  if (top.oneOf !== undefined) return { oneOf: top.oneOf }
  return {}
}

function looksLikeExpr (s) {
  return /[()\s:!<>=|&"']/.test(s)
}

function whenPredicate (spec, top) {
  const check = pickCheck(top)
  const hasCheck = top.is !== undefined || top.isNot !== undefined || top.oneOf !== undefined
  const entries = (Array.isArray(spec) ? spec : [spec]).map(function (item) {
    if (typeof item === 'string') {
      if (!hasCheck && looksLikeExpr(item)) return { expr: item }
      return Object.assign({ source: item }, check)
    }
    return item
  })
  return function (get) {
    return entries.every(function (e) {
      if (e && e.expr !== undefined) return testCondition(e.expr, get)
      return matchWhen(e, get)
    })
  }
}

function makeItem (el, test, base) {
  return { el, test, opts: Object.assign({}, base, dataOpts(el)), last: undefined, first: true }
}

function stringItem (el, base) {
  const expr = el.getAttribute(base.attr)
  let test
  if (expr !== null && expr !== undefined && String(expr).trim() !== '') {
    test = function (get) { return testCondition(expr, get) }
  } else if (base.when !== undefined) {
    test = whenPredicate(base.when, base)
  } else {
    test = function () { return true }
  }
  return makeItem(el, test, base)
}

function ruleItems (rules, base) {
  const items = []
  for (const rule of rules) {
    if (!rule) continue
    const list = toElements(rule.target)
    const entries = Array.isArray(rule.when) ? rule.when : []
    for (const el of list) {
      items.push(makeItem(el, function (get) {
        return entries.every(function (e) { return matchWhen(e, get) })
      }, base))
    }
  }
  return items
}

function createController (items, base, cascade, rescan) {
  const doc = docOf()
  const st = { evaluating: false, dirty: false, destroyed: false }

  function rawGet (src) {
    return getValue(src, doc)
  }

  function get (src) {
    if (!cascade) return rawGet(src)
    const els = resolveElements(src, doc)
    if (els.length > 0 && els.every(function (el) { return el.closest && el.closest('[data-showmo-state="hidden"]') })) {
      return undefined
    }
    return rawGet(src)
  }

  function pass (firstAll) {
    let changed = false
    for (const item of items) {
      const first = firstAll || item.first
      const visible = !!item.test(get)
      if (first || visible !== item.last) {
        applyVisibility(item.el, visible, item.opts, first)
        if (first) emitInit(item.el)
        else emitTransition(item.el, visible, item.opts)
        item.last = visible
        item.first = false
        changed = true
      }
    }
    return changed
  }

  function evaluate (firstAll) {
    if (st.destroyed) return
    if (st.evaluating) {
      st.dirty = true
      return
    }
    st.evaluating = true
    try {
      let first = !!firstAll
      for (let i = 0; i < 10; i++) {
        st.dirty = false
        const changed = pass(first)
        first = false
        if (!st.dirty && !changed) break
      }
    } finally {
      st.evaluating = false
    }
  }

  function onEvent () {
    evaluate(false)
  }

  if (doc) {
    doc.addEventListener('change', onEvent)
    doc.addEventListener('input', onEvent)
  }

  if (base.onload !== false) evaluate(true)

  return {
    refresh () {
      if (st.destroyed) return
      if (typeof rescan === 'function') rescan()
      evaluate(false)
    },
    destroy () {
      st.destroyed = true
      for (const item of items) {
        if (item.el.hasAttribute(INIT)) item.el.removeAttribute(INIT)
        if (!item.first) resetElement(item.el, item.opts)
      }
      if (doc) {
        doc.removeEventListener('change', onEvent)
        doc.removeEventListener('input', onEvent)
      }
    }
  }
}

export function showmo (targets, options) {
  const base = mergeOpts(options)
  const seen = new WeakSet()
  const items = []
  function addEl (el) {
    if (!el || el.nodeType !== 1 || seen.has(el)) return
    if (el.hasAttribute(INIT)) return
    seen.add(el)
    items.push(stringItem(el, base))
    el.setAttribute(INIT, 'true')
  }
  toElements(targets).forEach(addEl)
  function rescan () {
    if (typeof targets === 'string') {
      toElements(targets).forEach(addEl)
    } else {
      query('[' + base.attr + ']:not([' + INIT + '])').forEach(addEl)
    }
  }
  return createController(items, base, false, rescan)
}

export function showmoRules (rules, options) {
  const base = mergeOpts(options)
  const list = Array.isArray(rules) ? rules : []
  const seen = new WeakSet()
  const items = []
  function addItems () {
    for (const item of ruleItems(list, base)) {
      if (seen.has(item.el)) continue
      seen.add(item.el)
      items.push(item)
      item.el.setAttribute(INIT, 'true')
    }
  }
  addItems()
  function rescan () {
    addItems()
  }
  return createController(items, base, true, rescan)
}

export function initAll () {
  const els = query('[data-showmo]:not([' + INIT + '])')
  if (els.length) showmo(els, {})
  const rules = []
  for (const el of query('[data-showmo-rules]:not([' + INIT + '])')) {
    let entries
    try {
      entries = JSON.parse(el.getAttribute('data-showmo-rules'))
    } catch (err) {
      entries = null
    }
    if (!Array.isArray(entries)) {
      if (typeof console !== 'undefined' && console.warn) console.warn('showmo: bad data-showmo-rules JSON')
      el.setAttribute(INIT, 'true')
      continue
    }
    const t = el.getAttribute('data-showmo-target')
    rules.push({ target: t || el, when: entries })
  }
  if (rules.length) showmoRules(rules, {})
}
