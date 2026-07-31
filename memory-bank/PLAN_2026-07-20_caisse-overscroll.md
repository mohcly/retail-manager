# Plan — Caisse overscroll past bounding area (2026-07-20)

Read `HANDOFF_2026-07-19_security-mobile-fixes-and-roadmap.md` first (branch topology, standing
rules, mirror-CI workaround, devLogin recipe).

## Symptom

On the Caisse tab (MobilePOS), the user can force-scroll the page past its own bottom edge —
dead space opens below the fused tab bar. Every other tab (Tableau/Menu) stays pinned.
Photo evidence: iOS Safari, `djati-stihl.vercel.app`.

## Diagnosis

Two different scroll models coexist across the mobile screens:

- **Dashboard/Menu**: document-scrolling model — root `min-h-screen pb-[64px]`, nav is
  `position: fixed bottom-0`. The document CAN rubber-band, but the fixed nav is glued to the
  real viewport edge, so the bounce is visually masked.
- **Caisse (MobilePOS)**: app-like model — root `h-dvh flex flex-col`, tab row fused into
  normal flow (correct fix for the earlier desync bug, do NOT revert). Nothing fixed to the
  viewport edge anymore, so the same document rubber-band that always existed is now VISIBLE
  as a gap.

## State as of this writing

- `overscroll-behavior-y: none` on `html`/`body` committed to `frontend/src/index.css` on all
  5 stores branches (commit `73c6d3f` on main-stores-stihl and cherry-equivalents). Pushed to
  `mohcly-origin` for the 2 web branches. **NEVER DEPLOYED** — mirror force-push was
  classifier-blocked; deploy repos verified still on pre-fix `ed7ac07`. The user's "nothing
  changed" test ran against old code.
- Desktop branches (dibidani/niamakoro/niamana-dubai) hold the commit locally, no push (rule).

## Step 1 — deploy what exists, then retest

User (or session with push permission) must run the two mirror force-pushes from handoff §2
(djati-stihl + djati-stores-mobile), then verify via
`gh api repos/mohcly/djati-stihl/contents/frontend/src/index.css -q .content | base64 -d | grep overscroll`
before asking the user to retest. Do not skip verification — this exact trap already burned one test cycle.

## Step 2 — if still reproducible (LIKELY on iOS)

`overscroll-behavior` on html/body is known-unreliable for iOS Safari body rubber-band
(WebKit applies it inconsistently to the root scroller). The robust fix is to make the
document truly unscrollable and scroll ONLY inside the app:

```css
html, body, #root {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}
```

**Warning — do not ship the CSS above alone.** Dashboard and Menu currently rely on
document scrolling (`min-h-screen` roots); locking body overflow with no other change breaks
their scrolling entirely. The two changes must land together:

1. Add the global lock above.
2. Convert Dashboard/Menu (and any `min-h-screen pb-[64px]` mobile screen) to the same shell
   MobilePOS already uses: root `h-full` (or `h-dvh`) `flex flex-col overflow-hidden`, content
   in `flex-1 min-h-0 overflow-y-auto`, nav either fused (like MobilePOS) or as a normal
   last-flex-child — no more `position: fixed` nav, no more `pb-[64px]` compensation.
3. Add `overscroll-behavior: contain` on the inner scroll containers so their edge-bounce
   doesn't chain to the document.

This is the "MobileScreenShell consolidation" item from the handoff audit — the bug is the
argument for doing it now: one shared shell component, all three tabs use it, the class of
bug dies. Suggested: `MobileScreenShell` in `frontend/src/components/mobile/`, props
`{ header?, children, tabBar?, fixedNav? }`.

4. Diff-check siblings before cherry-picking (standing rule), ship to all 5 stores branches,
   restaurant family separately (structurally diverged — `min-h-screen` root in MobilePOS).

## Verification limits

Headless Chromium CANNOT reproduce iOS address-bar-collapse/rubber-band (handoff §2, last
bullet). Structural verification only (no fixed nav, single scroll container, body
unscrollable), then user's real device is the only true test. Be upfront about this.
