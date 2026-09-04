// Type definitions for showmo

/** Value read off a source: single field, checkbox group / multi-select, or nothing found. */
export type ShowmoValue = string | boolean | string[] | undefined

/** Reads the current value of a source key (`#id`, `name`, `name[key]`, `name[]`). */
export type GetValue = (source: string) => ShowmoValue

/** Built-in action names accepted by `ifTrue` / `ifFalse`. */
export type ShowmoAction = 'show' | 'hide' | 'enable' | 'disable' | 'clear' | 'ignore'

export type ActionSpec =
  | ShowmoAction
  | ((el: Element) => void)
  | Array<ShowmoAction | ((el: Element) => void)>

/** Animation presets shipped in `showmo.css`. */
export type AnimatePreset = 'fade' | 'slide' | 'pop'

/** Show/hide hook: a function, or a dotted path resolved against `globalThis`. */
export type HookSpec =
  | string
  | ((el: Element) => void)
  | Array<string | ((el: Element) => void)>

export type ComparisonOp = '===' | '!==' | '==' | '!=' | '>' | '<' | '>=' | '<='

/** One condition entry. Entries in a list are ANDed. */
export interface WhenEntry {
  /** Source key to read. Required unless `expr` is used. */
  source?: string
  /** Loose equality against the source value. */
  is?: unknown
  /** Loose inequality against the source value. */
  isNot?: unknown
  /** Matches when the source value equals any listed value. */
  oneOf?: unknown | unknown[]
  /** Comparison operator used with `value`. Defaults to `===`. */
  op?: ComparisonOp
  /** Right-hand side for `op`. */
  value?: unknown
  /** Full expression string, parsed instead of the fields above. */
  expr?: string
}

export type WhenSpec = string | WhenEntry | Array<string | WhenEntry>

export interface ShowmoOptions {
  /** Attribute holding the condition expression. Default `data-showmo`. */
  attr?: string
  /** Evaluate once on init. Default `true`. */
  onload?: boolean
  /** Extra class applied while hidden. */
  hiddenClass?: string
  /** Disable contained controls while hidden. */
  disableWhenHidden?: boolean
  /** Clear contained field values on hide. */
  clearWhenHidden?: boolean
  /** Drop `required` while hidden, restore on show. */
  requireWhenVisible?: boolean
  /** Animation preset, or `false` for none. */
  animate?: AnimatePreset | false
  /** Honour `prefers-reduced-motion`. Default `true`. */
  respectReducedMotion?: boolean
  /** Dispatch `change` on descendant fields after reveal. */
  refreshOnShow?: boolean
  /** Watch the DOM and re-scan when nodes are added or removed. Default `false`. */
  observe?: boolean
  /** Actions to run when the condition passes. Default `['show']`. */
  ifTrue?: ActionSpec
  /** Actions to run when the condition fails. Default `['hide']`. */
  ifFalse?: ActionSpec
  onShow?: HookSpec
  onHide?: HookSpec
  /** Receives parse and resolution warnings. Defaults to `console.warn`. */
  warn?: (message: string) => void
  /** Condition used when the target carries no expression attribute. */
  when?: WhenSpec
  /** Shorthand check paired with `when` given as a bare source key. */
  is?: unknown
  isNot?: unknown
  oneOf?: unknown | unknown[]
}

/** Global defaults, read from `window.showmoConfig` at call time. */
export type ShowmoConfig = ShowmoOptions

export interface ShowmoRule {
  /** Elements to toggle: selector, element, or element list. */
  target: string | Element | ArrayLike<Element>
  /** Condition for this target. */
  when?: WhenSpec
}

export interface ShowmoController {
  /** Re-scan for new targets and re-evaluate. */
  refresh(): void
  /** Stop listening and restore every managed element to its pre-showmo state. */
  destroy(): void
}

export type ShowmoTargets = string | Element | ArrayLike<Element>

/** Detail carried by `showmo:show`, `showmo:hide` and `showmo:init` events. */
export interface ShowmoEventDetail {
  target: Element
  firstRun: boolean
}

export function showmo (targets: ShowmoTargets, options?: ShowmoOptions): ShowmoController

export function showmoRules (rules: ShowmoRule[], options?: ShowmoOptions): ShowmoController

/** Wires up every `[data-showmo]` and `[data-showmo-rules]` element on the page. */
export function initAll (): void

export function getValue (source: string, root?: Document | Element): ShowmoValue

/** Evaluates an expression, returning `false` on any parse or lookup failure. */
export function testCondition (input: string, get?: GetValue): boolean

/** Compiles an expression into a predicate. Throws on malformed input. */
export function parseCondition (input: string): (get: GetValue) => boolean

declare global {
  interface Window {
    showmoConfig?: ShowmoConfig
  }
  interface DocumentEventMap {
    'showmo:show': CustomEvent<ShowmoEventDetail>
    'showmo:hide': CustomEvent<ShowmoEventDetail>
    'showmo:init': CustomEvent<ShowmoEventDetail>
  }
}
