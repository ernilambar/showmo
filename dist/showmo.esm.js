//#region src/values.js
function e(e) {
	return String(e).replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
function t(t, n) {
	let r = n || (typeof document < "u" ? document : void 0);
	if (!t || !r) return [];
	let i = String(t).trim();
	if (!i) return [];
	let a = [];
	try {
		a = Array.from(r.querySelectorAll("[name=\"" + e(i) + "\"]"));
	} catch {
		a = [];
	}
	if (a.length) return a;
	try {
		a = Array.from(r.querySelectorAll(i));
	} catch {
		a = [];
	}
	return a;
}
function n(e) {
	if (!e || !e.tagName) return;
	let t = (e.type || "").toLowerCase();
	return t === "checkbox" ? e.checked ? e.value : !1 : t === "radio" ? e.checked ? e.value : void 0 : e.tagName.toLowerCase() === "select" && e.multiple ? Array.from(e.selectedOptions || []).map(function(e) {
		return e.value;
	}) : e.value;
}
function r(e) {
	if (!e || !e.length) return;
	if (e.length === 1) return n(e[0]);
	let t = e.map(function(e) {
		return (e.type || e.tagName || "").toLowerCase();
	});
	if (t.every(function(e) {
		return e === "radio";
	})) {
		let t = e.find(function(e) {
			return e.checked;
		});
		return t ? t.value : void 0;
	}
	return t.every(function(e) {
		return e === "checkbox";
	}) ? e.filter(function(e) {
		return e.checked;
	}).map(function(e) {
		return e.value;
	}) : e.map(n);
}
function i(e, n) {
	return r(t(e, n));
}
function a(e) {
	return e == null || e === !1 || e === "" ? !1 : Array.isArray(e) ? e.some(a) : !!e;
}
function o(e, t) {
	return Array.isArray(e) ? e.some(function(e) {
		return o(e, t);
	}) : e == null ? e === t : t === void 0 ? e === void 0 : String(e) === String(t);
}
function s(e, t, n) {
	if (e === void 0) return !1;
	if (Array.isArray(e)) return e.some(function(e) {
		return s(e, t, n);
	});
	if (t === ">" || t === "<" || t === ">=" || t === "<=") {
		let r = Number(e), i = Number(n);
		return Number.isNaN(r) || Number.isNaN(i) ? !1 : t === ">" ? r > i : t === "<" ? r < i : t === ">=" ? r >= i : r <= i;
	}
	let r = o(e, n);
	return t === "!==" || t === "!=" ? !r : r;
}
//#endregion
//#region src/parse.js
function c(e) {
	let t = [], n = 0, r = e.length;
	for (; n < r;) {
		let i = e[n];
		if (i <= " ") {
			n++;
			continue;
		}
		let a = e.substr(n, 3);
		if (a === "===" || a === "!==") {
			t.push(1, a), n += 3;
			continue;
		}
		let o = e.substr(n, 2);
		if (o === "&&" || o === "||" || o === "==" || o === "!=" || o === ">=" || o === "<=") {
			t.push(o === "&&" ? 2 : o === "||" ? 3 : 1, o === "&&" || o === "||" ? 0 : o), n += 2;
			continue;
		}
		if (i === "(") {
			t.push(4, 0), n++;
			continue;
		}
		if (i === ")") {
			t.push(5, 0), n++;
			continue;
		}
		if (i === ":") {
			t.push(6, 0), n++;
			continue;
		}
		if (i === ",") {
			t.push(7, 0), n++;
			continue;
		}
		if (i === ">" || i === "<") {
			t.push(1, i), n++;
			continue;
		}
		if (i === "!") {
			t.push(8, 0), n++;
			continue;
		}
		if (i === "\"" || i === "'") {
			let a = n + 1, o = "";
			for (; a < r && e[a] !== i;) e[a] === "\\" && a + 1 < r ? (o += e[a + 1], a += 2) : o += e[a++];
			if (a >= r) throw Error("showmo: unterminated string");
			t.push(9, o), n = a + 1;
			continue;
		}
		let s = /^[0-9]+(\.[0-9]+)?/.exec(e.slice(n));
		if (s) {
			t.push(9, +s[0]), n += s[0].length;
			continue;
		}
		let c = /^[^\s()!:,<>=&|"']+/.exec(e.slice(n));
		if (!c) throw Error("showmo: bad character");
		let l = c[0];
		t.push(l === "true" || l === "false" || l === "null" ? 9 : 0, l === "true" ? !0 : l === "false" ? !1 : l === "null" ? null : l), n += l.length;
	}
	return t;
}
function l(e, t) {
	return (n) => e(n) || t(n);
}
function u(e, t) {
	return (n) => e(n) && t(n);
}
function d(e) {
	return (t) => !e(t);
}
function f(e) {
	let t = 0, n = () => e[t], r = () => {
		let n = e[t + 1];
		return t += 2, n;
	};
	function i() {
		let e = o();
		for (; n() === 3;) {
			t += 2;
			let n = o();
			e = l(e, n);
		}
		return e;
	}
	function o() {
		let e = c();
		for (; n() === 2;) {
			t += 2;
			let n = c();
			e = u(e, n);
		}
		return e;
	}
	function c() {
		return n() === 8 ? (t += 2, d(c())) : f();
	}
	function f() {
		if (n() === 4) {
			t += 2;
			let e = i();
			if (n() !== 5) throw Error("showmo: unbalanced parens");
			return t += 2, e;
		}
		return m();
	}
	function p() {
		let e = n();
		if (e !== 9 && e !== 0) throw Error("showmo: bad value");
		return r();
	}
	function m() {
		if (n() !== 0) throw Error("showmo: expected source");
		let e = r();
		if (n() === 1) {
			let t = r(), n = p();
			return (r) => s(r(e), t, n);
		}
		if (n() === 6) {
			t += 2;
			let r = !1;
			n() === 8 && (t += 2, r = !0);
			let i = [p()];
			for (; n() === 7;) t += 2, i.push(p());
			return (t) => {
				let n = t(e);
				if (n === void 0) return !1;
				let a = i.some((e) => s(n, "===", e));
				return r ? !a : a;
			};
		}
		return (t) => a(t(e));
	}
	let h = i();
	if (t !== e.length) throw Error("showmo: trailing tokens");
	return h;
}
function p(e) {
	return f(c(String(e)));
}
function m(e, t) {
	try {
		return !e || !String(e).trim() || !!p(e)(t || i);
	} catch {
		return !1;
	}
}
function h(e, t) {
	if (!e || !String(e).trim()) return function() {
		return !0;
	};
	let n;
	try {
		n = p(e);
	} catch (n) {
		return typeof t == "function" && t(n, String(e)), function() {
			return !1;
		};
	}
	return function(e) {
		try {
			return !!n(e || i);
		} catch {
			return !1;
		}
	};
}
//#endregion
//#region src/rules.js
var ee = [
	"===",
	"!==",
	"==",
	"!=",
	">",
	"<",
	">=",
	"<="
];
function g(e, t) {
	return Object.prototype.hasOwnProperty.call(e, t);
}
function _(e, t) {
	if (!e || typeof e.source != "string") return !1;
	let n = t(e.source);
	return g(e, "oneOf") && e.oneOf !== void 0 ? n !== void 0 && (Array.isArray(e.oneOf) ? e.oneOf : [e.oneOf]).some(function(e) {
		return o(n, e);
	}) : g(e, "is") && e.is !== void 0 ? n !== void 0 && o(n, e.is) : g(e, "isNot") && e.isNot !== void 0 ? n !== void 0 && !o(n, e.isNot) : g(e, "op") || g(e, "value") ? s(n, ee.includes(e.op) ? e.op : "===", e.value) : a(n);
}
//#endregion
//#region src/effects.js
var v = [
	"fade",
	"slide",
	"pop"
], y = "data-showmo-state", b = "showmo-hidden", x = "showmo-no-motion", S = "input,select,textarea", C = S + ",button";
function w(e) {
	return v.includes(e);
}
function T(e) {
	return !!e && typeof e.animate == "string" && w(e.animate);
}
function E(e) {
	return e && e.respectReducedMotion === !1 ? !1 : typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function D(e, t, n) {
	e.dispatchEvent(new CustomEvent(t, {
		bubbles: !0,
		detail: {
			target: e,
			firstRun: !!n
		}
	}));
}
function O(e) {
	D(e, "showmo:init", !0);
}
function k(e) {
	if (typeof e != "string") return;
	let t = typeof globalThis < "u" ? globalThis : void 0;
	for (let n of e.split(".")) {
		if (t == null) return;
		t = t[n];
	}
	return typeof t == "function" ? t : void 0;
}
function A(e, t) {
	e && typeof e.warn == "function" ? e.warn(t) : typeof console < "u" && console.warn(t);
}
function j(e, t, n) {
	let r = Array.isArray(e) ? e : [e];
	for (let e of r) {
		let r = typeof e == "function" ? e : typeof e == "string" ? k(e) : void 0;
		if (r) try {
			r(t);
		} catch {}
		else typeof e == "string" && A(n, "showmo: onShow/onHide global not found: " + e);
	}
}
function M(e, t, n) {
	D(e, t ? "showmo:show" : "showmo:hide", !1), j(t ? n.onShow : n.onHide, e, n);
	let r = e.getAttribute(t ? "data-showmo-onshow" : "data-showmo-onhide");
	if (r && j(r, e, n), t && n.refreshOnShow) for (let t of e.querySelectorAll(S)) t.dispatchEvent(new Event("change", { bubbles: !0 }));
}
function N(e, t, n) {
	let r = [];
	return e.matches && e.matches(n) && r.push(e), r.push(...e.querySelectorAll(t)), r;
}
function P(e) {
	for (let t of N(e, S, S)) t.getAttribute("data-showmo-required") === null && t.setAttribute("data-showmo-required", t.required ? "true" : "false");
}
function F(e) {
	e.dispatchEvent(new Event("change", { bubbles: !0 }));
}
var I = {
	show(e) {
		let t = e.getAttribute("data-showmo-display");
		e.style && (t && t !== "none" ? e.style.display = t : e.style.display === "none" && e.style.removeProperty("display")), e.hasAttribute && e.hasAttribute("hidden") && e.removeAttribute("hidden"), e.setAttribute("aria-hidden", "false"), e.setAttribute(y, "shown"), e.classList && e.classList.remove(b);
	},
	hide(e) {
		if (e.style) {
			if (e.getAttribute("data-showmo-display") === null) {
				let t = e.style.display;
				e.setAttribute("data-showmo-display", t && t !== "none" ? t : "");
			}
			e.style.display = "none";
		}
		e.setAttribute("aria-hidden", "true"), e.setAttribute(y, "hidden"), e.classList && e.classList.add(b);
	},
	enable(e) {
		for (let t of N(e, C, C)) t.getAttribute("data-showmo-disabled") !== null && (t.disabled = !1, t.removeAttribute("data-showmo-disabled"));
	},
	disable(e) {
		for (let t of N(e, C, C)) t.disabled || (t.disabled = !0, t.setAttribute("data-showmo-disabled", "true"));
	},
	clear(e) {
		for (let t of N(e, S, S)) {
			let e = (t.type || "").toLowerCase();
			if (e === "checkbox" || e === "radio") t.checked && (t.checked = !1, F(t));
			else if (t.tagName && t.tagName.toLowerCase() === "select" && t.multiple) {
				let e = !1;
				for (let n of t.options) n.selected && (n.selected = !1, e = !0);
				e && F(t);
			} else t.value !== "" && (t.value = "", F(t));
		}
	},
	ignore() {}
};
function te(e, t) {
	let n = Array.isArray(e) ? e : [e];
	for (let e of n) if (typeof e == "function") try {
		e(t);
	} catch {}
	else typeof e == "string" && I[e] && I[e](t);
}
function ne(e, t) {
	let n = e.getAttribute("data-showmo-display");
	n !== null && (e.style && (n ? e.style.display = n : e.style.removeProperty("display")), e.removeAttribute("data-showmo-display")), e.removeAttribute("aria-hidden"), e.removeAttribute(y), e.classList && (e.classList.remove(b, x, "showmo-fade", "showmo-slide", "showmo-pop"), t && t.hiddenClass && e.classList.remove(t.hiddenClass)), I.enable(e);
	for (let t of N(e, S, S)) t.getAttribute("data-showmo-required") !== null && (t.required = t.getAttribute("data-showmo-required") === "true", t.removeAttribute("data-showmo-required"));
}
function re(e, t, n, r) {
	if (T(n) ? (e.classList && (e.classList.add("showmo-" + n.animate), e.classList.toggle(x, r || E(n)), e.classList.toggle(b, !t)), t && e.hasAttribute && e.hasAttribute("hidden") && e.removeAttribute("hidden"), e.setAttribute("aria-hidden", t ? "false" : "true"), e.setAttribute(y, t ? "shown" : "hidden")) : (te(t ? n.ifTrue === void 0 ? ["show"] : n.ifTrue : n.ifFalse === void 0 ? ["hide"] : n.ifFalse, e), e.setAttribute("aria-hidden", t ? "false" : "true"), e.setAttribute(y, t ? "shown" : "hidden"), e.classList && e.classList.toggle(b, !t)), n.hiddenClass && e.classList && e.classList.toggle(n.hiddenClass, !t), n.requireWhenVisible) {
		P(e);
		for (let n of N(e, S, S)) n.required = t && n.getAttribute("data-showmo-required") === "true";
	}
	n.disableWhenHidden && I[t ? "enable" : "disable"](e), !t && n.clearWhenHidden && I.clear(e);
}
//#endregion
//#region src/showmo.js
var ie = {
	attr: "data-showmo",
	onload: !0,
	hiddenClass: "",
	disableWhenHidden: !1,
	clearWhenHidden: !1,
	requireWhenVisible: !1,
	animate: !1,
	respectReducedMotion: !0,
	refreshOnShow: !1,
	ifTrue: void 0,
	ifFalse: void 0,
	onShow: void 0,
	onHide: void 0,
	warn: void 0,
	when: void 0,
	is: void 0,
	isNot: void 0,
	oneOf: void 0
}, L = "data-showmo-init";
function R() {
	return typeof document < "u" ? document : void 0;
}
function z(e) {
	let t = R();
	if (!t) return [];
	try {
		return Array.from(t.querySelectorAll(e));
	} catch {
		return [];
	}
}
function B() {
	return typeof window < "u" && window.showmoConfig ? window.showmoConfig : {};
}
function V(e) {
	let t = R();
	if (!e || !t) return [];
	if (typeof e == "string") return z(e);
	if (e.nodeType === 1) return [e];
	if (typeof e.length == "number") try {
		return Array.from(e).filter(function(e) {
			return e && e.nodeType === 1;
		});
	} catch {
		return [];
	}
	return [];
}
function H(e, t) {
	let n = e.getAttribute(t);
	if (n === null) return;
	if (n === "") return !0;
	let r = n.trim().toLowerCase();
	return r !== "false" && r !== "0" && r !== "no" && r !== "off";
}
function U(e) {
	if (e == null) return;
	if (typeof e != "string") return !1;
	let t = e.trim().toLowerCase();
	if (t !== "") return t === "false" || t === "0" || t === "no" || t === "off" ? !1 : w(t) ? t : !1;
}
function W(e) {
	let t = {};
	for (let n of [
		["data-showmo-disable", "disableWhenHidden"],
		["data-showmo-clear", "clearWhenHidden"],
		["data-showmo-require", "requireWhenVisible"],
		["data-showmo-refresh", "refreshOnShow"]
	]) {
		let r = H(e, n[0]);
		r !== void 0 && (t[n[1]] = r);
	}
	let n = e.getAttribute("data-showmo-class");
	n !== null && (t.hiddenClass = n || "");
	let r = e.getAttribute("data-showmo-animate");
	if (r !== null) {
		let e = U(r);
		e !== void 0 && (t.animate = e);
	}
	return t;
}
function G(e) {
	let t = Object.assign({}, ie, B(), e), n = U(t.animate);
	return t.animate = n !== void 0 && n, t;
}
function K(e) {
	return e.is === void 0 ? e.isNot === void 0 ? e.oneOf === void 0 ? {} : { oneOf: e.oneOf } : { isNot: e.isNot } : { is: e.is };
}
function q(e) {
	return /[()\s:!<>=|&"']/.test(e);
}
function J(e) {
	return function(t, n) {
		A(e, "showmo: bad condition " + JSON.stringify(n) + " - " + t.message);
	};
}
function Y(e, t) {
	return e.map(function(e) {
		if (e && e.expr !== void 0) {
			let n = h(e.expr, J(t));
			return function(e) {
				return n(e);
			};
		}
		return function(t) {
			return _(e, t);
		};
	});
}
function ae(e, t) {
	let n = K(t), r = t.is !== void 0 || t.isNot !== void 0 || t.oneOf !== void 0, i = Y((Array.isArray(e) ? e : [e]).map(function(e) {
		return typeof e == "string" ? !r && q(e) ? { expr: e } : Object.assign({ source: e }, n) : e;
	}), t);
	return function(e) {
		return i.every(function(t) {
			return t(e);
		});
	};
}
function X(e, t, n) {
	return {
		el: e,
		test: t,
		opts: Object.assign({}, n, W(e)),
		last: void 0,
		first: !0
	};
}
function oe(e, t) {
	let n = e.getAttribute(t.attr), r;
	return r = n != null && String(n).trim() !== "" ? h(n, J(t)) : t.when === void 0 ? function() {
		return !0;
	} : ae(t.when, t), X(e, r, t);
}
function se(e, t) {
	let n = [];
	for (let r of e) {
		if (!r) continue;
		let e = V(r.target), i = r.when, a;
		a = typeof i == "string" ? [{ expr: i }] : Array.isArray(i) ? i : i && typeof i == "object" ? [i] : [];
		let o = Y(a, t);
		for (let r of e) n.push(X(r, function(e) {
			return o.every(function(t) {
				return t(e);
			});
		}, t));
	}
	return n;
}
function Z(e, n, r) {
	let a = R(), o = {
		evaluating: !1,
		dirty: !1,
		destroyed: !1
	};
	function s(e) {
		let n = t(e, a);
		if (!(n.length > 0 && n.every(function(e) {
			return e.closest && e.closest("[data-showmo-state=\"hidden\"],[hidden]");
		}))) return i(e, a);
	}
	function c(t) {
		let n = !1, r = /* @__PURE__ */ new Map();
		function i(e) {
			if (r.has(e)) return r.get(e);
			let t = s(e);
			return r.set(e, t), t;
		}
		for (let r of e) {
			let e = t || r.first, a = !!r.test(i);
			(e || a !== r.last) && (re(r.el, a, r.opts, e), e ? O(r.el) : M(r.el, a, r.opts), r.last = a, r.first = !1, n = !0);
		}
		return n;
	}
	function l(e) {
		if (!o.destroyed) {
			if (o.evaluating) {
				o.dirty = !0;
				return;
			}
			o.evaluating = !0;
			try {
				let t = !!e;
				for (let e = 0; e < 10; e++) {
					o.dirty = !1;
					let e = c(t);
					if (t = !1, !o.dirty && !e) break;
				}
			} finally {
				o.evaluating = !1;
			}
		}
	}
	function u() {
		l(!1);
	}
	return a && (a.addEventListener("change", u), a.addEventListener("input", u)), n.onload !== !1 && l(!0), {
		refresh() {
			o.destroyed || (typeof r == "function" && r(), l(!1));
		},
		destroy() {
			o.destroyed = !0;
			for (let t of e) t.el.hasAttribute(L) && t.el.removeAttribute(L), t.first || ne(t.el, t.opts);
			a && (a.removeEventListener("change", u), a.removeEventListener("input", u));
		}
	};
}
function Q(e, t) {
	let n = G(t), r = /* @__PURE__ */ new WeakSet(), i = [];
	function a(e) {
		e && e.nodeType === 1 && !r.has(e) && (e.hasAttribute(L) || (r.add(e), i.push(oe(e, n)), e.setAttribute(L, "true")));
	}
	V(e).forEach(a);
	function o() {
		typeof e == "string" ? V(e).forEach(a) : z("[" + n.attr + "]:not([data-showmo-init])").forEach(a);
	}
	return Z(i, n, o);
}
function $(e, t) {
	let n = G(t), r = Array.isArray(e) ? e : [], i = /* @__PURE__ */ new WeakSet(), a = [];
	function o() {
		for (let e of se(r, n)) i.has(e.el) || (i.add(e.el), a.push(e), e.el.setAttribute(L, "true"));
	}
	o();
	function s() {
		o();
	}
	return Z(a, n, s);
}
function ce() {
	let e = z("[data-showmo]:not([" + L + "])");
	e.length && Q(e, {});
	let t = [];
	for (let e of z("[data-showmo-rules]:not([" + L + "])")) {
		let n;
		try {
			n = JSON.parse(e.getAttribute("data-showmo-rules"));
		} catch {
			n = null;
		}
		if (!Array.isArray(n)) {
			A(B(), "showmo: bad data-showmo-rules JSON"), e.setAttribute(L, "true");
			continue;
		}
		let r = e.getAttribute("data-showmo-target");
		t.push({
			target: r || e,
			when: n
		});
	}
	t.length && $(t, {});
}
//#endregion
export { i as getValue, ce as initAll, p as parseCondition, Q as showmo, $ as showmoRules, m as testCondition };
