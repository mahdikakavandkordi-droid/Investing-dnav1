# Investor DNA — Real Mobile Device Canary

Status: manual product QA checklist  
Purpose: validate the mobile experience on a real iPhone/Android device after automated CI and screenshot audits are green.

Automated screenshots are not a substitute for this canary. The goal is to catch issues that only appear with a real browser viewport, keyboard, safe area, scrolling momentum, touch gestures and perceived density.

## Before starting

Use the latest deployed preview/build for the current integration head. Record:

- device model:
- OS version:
- browser:
- deployment URL:
- commit SHA:
- date/time:

Do not use this checklist to judge investment suitability or scientific validity. It is a product/device QA pass.

## Pass 1 — shell and navigation

Open the app from a fresh tab and check:

1. branded top bar is not under the notch/status area;
2. bottom navigation clears the home indicator and remains tappable;
3. Home / DNA / Explore / Watchlist / Profile each show the correct active tab;
4. no page can be dragged sideways at document level;
5. horizontal rails still scroll independently where intended;
6. rotating to landscape does not cover content with the top or bottom chrome.

## Pass 2 — forms and keyboard

On Profile/sign-in, Context, Compare and Screener:

1. tap each text/select field;
2. iOS must not auto-zoom the page when the keyboard appears;
3. focused controls stay visible above the keyboard;
4. closing the keyboard does not leave the viewport shifted or clipped;
5. buttons remain at least thumb-sized and do not require precision tapping.

## Pass 3 — Investing DNA

Run the assessment as a guest:

1. start without creating an account;
2. questionnaire hides the bottom app navigation;
3. sticky answer/continue actions do not fight the browser toolbar;
4. back/forward between questions feels stable;
5. long answer labels wrap cleanly;
6. result is readable without accidental horizontal overflow;
7. the DNA hub can return to the same-session result.

## Pass 4 — Context and Match

From Result, add money context and continue to Match:

1. Result -> Context -> Match is continuous;
2. context fields do not have hidden defaults;
3. Match shows the current state clearly;
4. the Money Context card expands/collapses reliably;
5. horizontal Match cards swipe without moving the entire page sideways;
6. component labels and score explanations remain readable;
7. Review / DNA-only / numeric Match states are visually distinct.

## Pass 5 — Explore and research

Open Explore and several instruments:

1. filter chips swipe naturally;
2. ETF/GIC/T-Bill/Bond cards remain readable;
3. investment detail Compare/Save actions stay reachable;
4. progressive-disclosure sections open and close with one tap;
5. opening a section does not jump the viewport unexpectedly;
6. official/source links remain reachable;
7. missing values never appear as fake zeroes.

## Pass 6 — Compare, Screener and Watchlist

1. Compare cards make horizontal swiping obvious;
2. card snapping does not trap vertical scrolling;
3. Screener controls remain usable with the keyboard open;
4. selected-compare bar does not overlap the bottom navigation;
5. Watchlist rows are easy to open/remove;
6. empty Watchlist and empty Explore states look intentional rather than broken.

## Pass 7 — account continuity

When real hosted Auth is ready for canary use:

1. start a Save action while signed out;
2. request the secure email link;
3. return to the same browser/app session;
4. confirm the incoming investment intent is still visible;
5. save to Watchlist;
6. sign out;
7. sign in again;
8. confirm the saved item persists.

This is separate from mocked CI and should only be marked PASS after the real hosted round trip succeeds.

## Severity labels

- P0 — cannot continue, data/security issue, wrong account state.
- P1 — core flow blocked or major content hidden.
- P2 — confusing interaction, overlapping UI, broken gesture, keyboard/safe-area issue.
- P3 — visual polish, spacing, wording or minor consistency.

For every issue capture:

- route;
- what you tapped;
- expected result;
- actual result;
- screenshot/screen recording when useful;
- severity.

## Exit rule

The mobile canary is PASS only when:

- no P0/P1 issues remain;
- no repeatable keyboard/safe-area/navigation blocker remains;
- core guest flow and signed-in research flow can both be completed;
- any accepted P2/P3 issue is documented for the next polish batch.
