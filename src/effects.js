const PRESETS = ['fade', 'slide', 'pop']
const STATE = 'data-showmo-state'
const HIDDEN_CLS = 'showmo-hidden'
const NO_MOTION = 'showmo-no-motion'
const FIELDS = 'input,select,textarea'
const CTRLS = FIELDS + ',button'

export function isPreset (name) {
  return PRESETS.includes(name)
}

export function useAnimate (opts) {
  return !!opts && typeof opts.animate === 'string' && isPreset(opts.animate)
}

export function reducedMotion (opts) {
  if (opts && opts.respectReducedMotion === false) return false
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function fire (el, name, firstRun) {
  el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { target: el, firstRun: !!firstRun } }))
}

export function emitInit (el) {
  fire(el, 'showmo:init', true)
}

export function resolveGlobal (dotted) {
  if (typeof dotted !== 'string') return undefined
  let cur = typeof globalThis !== 'undefined' ? globalThis : undefined
  for (const part of dotted.split('.')) {
    if (cur === undefined || cur === null) return undefined
    cur = cur[part]
  }
  return typeof cur === 'function' ? cur : undefined
}

function warnOf (opts, msg) {
  if (opts && typeof opts.warn === 'function') opts.warn(msg)
  else if (typeof console !== 'undefined') console.warn(msg)
}

function runHookFns (value, el, opts) {
  const list = Array.isArray(value) ? value : [value]
  for (const item of list) {
    const fn = typeof item === 'function' ? item : typeof item === 'string' ? resolveGlobal(item) : undefined
    if (fn) {
      try {
        fn(el)
      } catch (err) {}
    } else if (typeof item === 'string') {
      warnOf(opts, 'showmo: onShow/onHide global not found: ' + item)
    }
  }
}

export function emitTransition (el, visible, opts) {
  fire(el, visible ? 'showmo:show' : 'showmo:hide', false)
  runHookFns(visible ? opts.onShow : opts.onHide, el, opts)
  const attr = el.getAttribute(visible ? 'data-showmo-onshow' : 'data-showmo-onhide')
  if (attr) runHookFns(attr, el, opts)
  if (visible && opts.refreshOnShow) {
    for (const c of el.querySelectorAll(FIELDS)) {
      c.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
}

function collect (el, sel, selfSel) {
  const out = []
  if (el.matches && el.matches(selfSel)) out.push(el)
  out.push(...el.querySelectorAll(sel))
  return out
}

function snapshotRequired (el) {
  for (const c of collect(el, FIELDS, FIELDS)) {
    if (c.getAttribute('data-showmo-required') === null) {
      c.setAttribute('data-showmo-required', c.required ? 'true' : 'false')
    }
  }
}

function changedEvent (c) {
  c.dispatchEvent(new Event('change', { bubbles: true }))
}

const BUILTINS = {
  show (el) {
    const orig = el.getAttribute('data-showmo-display')
    if (el.style) {
      if (orig && orig !== 'none') el.style.display = orig
      else if (el.style.display === 'none') el.style.removeProperty('display')
    }
    if (el.hasAttribute && el.hasAttribute('hidden')) el.removeAttribute('hidden')
    el.setAttribute('aria-hidden', 'false')
    el.setAttribute(STATE, 'shown')
    if (el.classList) el.classList.remove(HIDDEN_CLS)
  },
  hide (el) {
    if (el.style) {
      if (el.getAttribute('data-showmo-display') === null) {
        const cur = el.style.display
        el.setAttribute('data-showmo-display', cur && cur !== 'none' ? cur : '')
      }
      el.style.display = 'none'
    }
    el.setAttribute('aria-hidden', 'true')
    el.setAttribute(STATE, 'hidden')
    if (el.classList) el.classList.add(HIDDEN_CLS)
  },
  enable (el) {
    for (const c of collect(el, CTRLS, CTRLS)) {
      if (c.getAttribute('data-showmo-disabled') !== null) {
        c.disabled = false
        c.removeAttribute('data-showmo-disabled')
      }
    }
  },
  disable (el) {
    for (const c of collect(el, CTRLS, CTRLS)) {
      if (c.disabled) continue
      c.disabled = true
      c.setAttribute('data-showmo-disabled', 'true')
    }
  },
  clear (el) {
    for (const c of collect(el, FIELDS, FIELDS)) {
      const type = (c.type || '').toLowerCase()
      if (type === 'checkbox' || type === 'radio') {
        if (c.checked) {
          c.checked = false
          changedEvent(c)
        }
      } else if (c.tagName && c.tagName.toLowerCase() === 'select' && c.multiple) {
        let touched = false
        for (const o of c.options) {
          if (o.selected) {
            o.selected = false
            touched = true
          }
        }
        if (touched) changedEvent(c)
      } else if (c.value !== '') {
        c.value = ''
        changedEvent(c)
      }
    }
  },
  ignore () {}
}

export { BUILTINS }

function runActions (actions, el) {
  const list = Array.isArray(actions) ? actions : [actions]
  for (const a of list) {
    if (typeof a === 'function') {
      try {
        a(el)
      } catch (err) {}
    } else if (typeof a === 'string' && BUILTINS[a]) {
      BUILTINS[a](el)
    }
  }
}

export function applyVisibility (el, visible, opts, firstRun) {
  if (useAnimate(opts)) {
    if (el.classList) {
      el.classList.add('showmo-' + opts.animate)
      el.classList.toggle(NO_MOTION, firstRun || reducedMotion(opts))
      el.classList.toggle(HIDDEN_CLS, !visible)
    }
    if (visible && el.hasAttribute && el.hasAttribute('hidden')) el.removeAttribute('hidden')
    el.setAttribute('aria-hidden', visible ? 'false' : 'true')
    el.setAttribute(STATE, visible ? 'shown' : 'hidden')
  } else {
    runActions(visible
      ? (opts.ifTrue === undefined ? ['show'] : opts.ifTrue)
      : (opts.ifFalse === undefined ? ['hide'] : opts.ifFalse), el)
    el.setAttribute('aria-hidden', visible ? 'false' : 'true')
    el.setAttribute(STATE, visible ? 'shown' : 'hidden')
    if (el.classList) el.classList.toggle(HIDDEN_CLS, !visible)
  }
  if (opts.hiddenClass && el.classList) el.classList.toggle(opts.hiddenClass, !visible)
  if (opts.requireWhenVisible) {
    snapshotRequired(el)
    for (const c of collect(el, FIELDS, FIELDS)) {
      c.required = visible && c.getAttribute('data-showmo-required') === 'true'
    }
  }
  if (opts.disableWhenHidden) BUILTINS[visible ? 'enable' : 'disable'](el)
  if (!visible && opts.clearWhenHidden) BUILTINS.clear(el)
}
