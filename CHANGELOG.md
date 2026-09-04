# Showmo Changelog

## 0.1.0 - 2026-09-04
- Added: Initial release.
- Added: Parse failures in conditions now report through the `warn` hook instead of failing silently.
- Changed: Conditions are compiled once per element instead of re-parsed on every evaluation pass.
- Changed: Hidden sources cascade in both `showmo()` and `showmoRules()`. Previously only `showmoRules()` cascaded.
- Changed: Cascade also treats the standard `hidden` attribute as hidden, not just showmo's own `data-showmo-state="hidden"`.
- Changed: Source values are cached per evaluation pass, cutting repeated DOM queries.
