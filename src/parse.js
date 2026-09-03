import { getValue, isTruthy, compareValues } from './values.js'

function tokenize (input) {
  const tk = []
  let i = 0
  const n = input.length
  while (i < n) {
    const ch = input[i]
    if (ch <= ' ') {
      i++
      continue
    }
    const c3 = input.substr(i, 3)
    if (c3 === '===' || c3 === '!==') {
      tk.push(1, c3)
      i += 3
      continue
    }
    const c2 = input.substr(i, 2)
    if (c2 === '&&' || c2 === '||' || c2 === '==' || c2 === '!=' || c2 === '>=' || c2 === '<=') {
      tk.push(c2 === '&&' ? 2 : c2 === '||' ? 3 : 1, c2 === '&&' || c2 === '||' ? 0 : c2)
      i += 2
      continue
    }
    if (ch === '(') {
      tk.push(4, 0)
      i++
      continue
    }
    if (ch === ')') {
      tk.push(5, 0)
      i++
      continue
    }
    if (ch === ':') {
      tk.push(6, 0)
      i++
      continue
    }
    if (ch === ',') {
      tk.push(7, 0)
      i++
      continue
    }
    if (ch === '>' || ch === '<') {
      tk.push(1, ch)
      i++
      continue
    }
    if (ch === '!') {
      tk.push(8, 0)
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1
      let out = ''
      while (j < n && input[j] !== ch) {
        if (input[j] === '\\' && j + 1 < n) {
          out += input[j + 1]
          j += 2
        } else {
          out += input[j++]
        }
      }
      if (j >= n) throw new Error('showmo: unterminated string')
      tk.push(9, out)
      i = j + 1
      continue
    }
    const num = /^[0-9]+(\.[0-9]+)?/.exec(input.slice(i))
    if (num) {
      tk.push(9, +num[0])
      i += num[0].length
      continue
    }
    const word = /^[^\s()!:,<>=&|"']+/.exec(input.slice(i))
    if (!word) throw new Error('showmo: bad character')
    const w = word[0]
    tk.push(w === 'true' || w === 'false' || w === 'null' ? 9 : 0, w === 'true' ? true : w === 'false' ? false : w === 'null' ? null : w)
    i += w.length
  }
  return tk
}

function orFn (a, r) {
  return (g) => a(g) || r(g)
}

function andFn (a, r) {
  return (g) => a(g) && r(g)
}

function notFn (x) {
  return (g) => !x(g)
}

function parseTokens (tk) {
  let pos = 0
  const peekK = () => tk[pos]
  const nextV = () => {
    const v = tk[pos + 1]
    pos += 2
    return v
  }
  function or () {
    let l = and()
    while (peekK() === 3) {
      pos += 2
      const r = and()
      const a = l
      l = orFn(a, r)
    }
    return l
  }
  function and () {
    let l = unary()
    while (peekK() === 2) {
      pos += 2
      const r = unary()
      const a = l
      l = andFn(a, r)
    }
    return l
  }
  function unary () {
    if (peekK() === 8) {
      pos += 2
      const x = unary()
      return notFn(x)
    }
    return primary()
  }
  function primary () {
    if (peekK() === 4) {
      pos += 2
      const x = or()
      if (peekK() !== 5) throw new Error('showmo: unbalanced parens')
      pos += 2
      return x
    }
    return clause()
  }
  function value () {
    const k = peekK()
    if (k !== 9 && k !== 0) throw new Error('showmo: bad value')
    return nextV()
  }
  function clause () {
    if (peekK() !== 0) throw new Error('showmo: expected source')
    const src = nextV()
    if (peekK() === 1) {
      const op = nextV()
      const rhs = value()
      return (g) => compareValues(g(src), op, rhs)
    }
    if (peekK() === 6) {
      pos += 2
      let neg = false
      if (peekK() === 8) {
        pos += 2
        neg = true
      }
      const list = [value()]
      while (peekK() === 7) {
        pos += 2
        list.push(value())
      }
      return (g) => {
        const v = g(src)
        if (v === undefined) return false
        const hit = list.some((w) => compareValues(v, '===', w))
        return neg ? !hit : hit
      }
    }
    return (g) => isTruthy(g(src))
  }
  const root = or()
  if (pos !== tk.length) throw new Error('showmo: trailing tokens')
  return root
}

export function parseCondition (input) {
  return parseTokens(tokenize(String(input)))
}

export function testCondition (input, get) {
  try {
    if (!input || !String(input).trim()) return true
    return !!parseCondition(input)(get || getValue)
  } catch (err) {
    return false
  }
}

export function conditionSources (input) {
  try {
    if (!input || !String(input).trim()) return []
    const tk = tokenize(String(input))
    const out = []
    for (let i = 0; i < tk.length; i += 2) {
      if (tk[i] === 0 && !out.includes(tk[i + 1])) out.push(tk[i + 1])
    }
    return out
  } catch (err) {
    return []
  }
}
