# showmo

Show it when it matters — safe conditional visibility without eval.

Zero-dependency vanilla JS: show/hide DOM elements based on form field values. Markup only. Conditions run through a hand-written parser — no `eval`, no `new Function`.

```html
<script src="./dist/showmo.min.js" defer></script>

<select id="country">
  <option value="US">US</option>
  <option value="NP">Nepal</option>
</select>
<label><input type="checkbox" id="newsletter" /> Subscribe</label>

<div data-showmo="#country:NP">Shown when country is Nepal.</div>
<div data-showmo="#country:NP && #newsletter" data-showmo-clear="true">
  Shown when Nepal AND subscribed; cleared while hidden.
</div>
```

No JavaScript needed — the script auto-initializes on `[data-showmo]`.

## Syntax

Clauses joined by `&&`, `||`, `!`, parentheses. Sources: `#id`, `name`, `name[key]`, `name[]`.

| Form | Meaning |
| --- | --- |
| `#nl` | truthy (checked box, non-empty value, selected option) |
| `!#nl` | falsy |
| `#country:NP` | equality |
| `#country:!US` | inequality |
| `#country:NP,IN,BT` | any-of |
| `#city:"New York"` | quoted values; numbers, `true`/`false`/`null` work too |

Full expressions also support `=== !== == != > < >= <=`. Anything else (method calls, arrows, template literals) evaluates to `false`, never throws.

## Effects

| Attribute | Option | Meaning |
| --- | --- | --- |
| `data-showmo-disable` | `disableWhenHidden` | disable controls while hidden |
| `data-showmo-clear` | `clearWhenHidden` | clear values on hide (dispatches `change`) |
| `data-showmo-require` | `requireWhenVisible` | drop `required` while hidden, restore on show |
| `data-showmo-class` | `hiddenClass` | extra class while hidden |
| `data-showmo-animate="fade\|slide\|pop"` | `animate` | animation preset (needs `showmo.css`) |
| `data-showmo-onshow` / `data-showmo-onhide` | `onShow` / `onHide` | dotted global called on transitions |
| `data-showmo-refresh` | `refreshOnShow` | dispatch `change` on descendants after reveal |

Precedence: per-element attrs > JS call options > `window.showmoConfig` > defaults.

## JS API

```js
import { showmo, showmoRules } from 'showmo';

showmo('#extra', { when: '#country', is: 'NP' });

showmo('.conditional', {
  attr: 'data-condition',
  ifFalse: ['hide', 'disable', 'clear'],
});

showmoRules(
  [{ target: '#city-row', when: [{ source: '#country', is: 'NP' }] }],
  { disableWhenHidden: true }
);
```

`ifTrue`/`ifFalse` accept action names (`show hide enable disable clear ignore`), functions, or arrays. `when` entries are ANDed; hidden sources cascade; chains settle via fixpoint. Both APIs return `{ refresh(), destroy() }` — call `refresh()` for dynamically added markup.

JSON rules also work inline: `<tr data-showmo-rules='[{"source":"#country","is":"NP"}]'>` (own target; `data-showmo-target="#other"` points elsewhere).

## Animation

```html
<link rel="stylesheet" href="./dist/showmo.css" />
<div data-showmo="#country:NP" data-showmo-animate="fade">Fades in/out.</div>
<div data-showmo="#country:NP" data-showmo-animate="slide" style="--showmo-duration:.25s">
  <div class="showmo-inner">Slides open; needs this one inner wrapper.</div>
</div>
```

Duration via `--showmo-duration` (default `.2s`); reduced-motion collapses to instant; first run never animates.

## Widget refresh

Editors like CodeMirror mis-measure while hidden — refresh on reveal:

```js
document.addEventListener('showmo:show', (e) =>
  e.detail.target.querySelectorAll('.CodeMirror').forEach((el) => el.CodeMirror?.refresh()));
```

State changes dispatch bubbling `showmo:show` / `showmo:hide` (`detail: { target, firstRun }`), plus one-time `showmo:init`. Transitions only, never spam.

## Install

```bash
npm install showmo
```

`dist/showmo.esm.js` for bundlers, `dist/showmo.min.js` as a plain script tag, `dist/showmo.css` for presets only. Zero dependencies.
