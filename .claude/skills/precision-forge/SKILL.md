---
name: precision-forge
description: >-
  Precision Forge — surgical error detection and correction for advanced Excel
  spreadsheets. Builds workbooks under a self-auditing loop: every slice is
  mechanically audited before the next one is written, every formula, reference
  and data type is checked, every number is recalculated and proved, and every
  defect found is recorded so the same class of error is caught earlier next
  time. Use this skill whenever building, extending, repairing or reviewing a
  non-trivial .xlsx/.xlsm — financial models, dashboards, budgets, forecasts,
  pricing sheets, reconciliations, trackers — and whenever someone reports that
  a spreadsheet is wrong, broken, showing #REF!/#VALUE!/#N/A/#DIV/0!, that a
  total does not add up, that a VLOOKUP returns the wrong row, or that numbers
  changed after an edit. Use it even when the request sounds small ("just add a
  column", "quick fix to this formula"), because single-cell edits inside a
  filled block are exactly where silent errors enter. Trigger on: build a
  spreadsheet, fix my Excel, audit these formulas, why is this total wrong,
  check this workbook, validate this model.
effort: xhigh
---

# Precision Forge

A spreadsheet fails differently from code. Code that is wrong usually crashes;
a spreadsheet that is wrong keeps producing confident numbers. Nobody sees the
one row where the VAT rate is 0.19 instead of 0.21. The total still totals. The
file still opens. The decision still gets made.

So this skill does not "check the work at the end". It puts a machine between
you and every block you write, and refuses to let a defect travel more than one
slice from where it was introduced. A defect caught while you still remember
writing the block costs a minute; the same defect found three blocks later
costs an hour of bisecting, and found after delivery costs your credibility.

## Setup

```bash
pip install openpyxl formulas      # formulas is the recalculation engine
```

`openpyxl` is required. Without `formulas` the static audit still runs, but no
number is ever verified — in that case say so explicitly rather than letting
"audited" imply "the numbers are right".

Paths below assume the scripts live at `.claude/skills/precision-forge/scripts/`.

## The loop

Six gates. Each one produces feedback you act on before the next is opened.
Never open a gate with unresolved `critical` findings behind it — that is the
whole mechanism, and skipping it is how you end up debugging a workbook instead
of building one.

### Gate 0 — Start by remembering

```bash
python3 scripts/ledger.py --path .precision-forge/ledger.json init      # first time only
python3 scripts/ledger.py --path .precision-forge/ledger.json report
```

Read the watchlist before writing anything. It lists what has actually gone
wrong in this project, worst first. If `VLOOKUP_APPROX` has bitten eleven
times, you already know to write the fourth argument the first time instead of
being told about it eleven more times. This is the cheapest gate and the one
most often skipped.

### Gate 1 — Validate the inputs before you build on them

Every downstream defect that comes from bad source data is unfixable later,
because the formulas are correct and the answer is still wrong. Before writing
a single formula against a dataset, establish:

- **Types.** Is every column actually the type it looks like? Numbers stored as
  text are the classic: they render right-aligned-ish, they look fine, and
  `SUM` skips them, so the total is quietly low.
- **Keys.** For anything you will look up: are the keys unique, trimmed, and
  consistently cased? A trailing space makes an exact-match lookup fail on a
  value that is visually identical.
- **Completeness.** Blank rows in the middle, headers repeated mid-table,
  merged cells, footnotes parked in the data region.
- **Range.** Negatives where only positives make sense, dates outside the
  period, magnitudes that are off by 1000 (unit confusion).

Fix the data here, in the source, and write down what you changed. Cleaning
silently is how a reconciliation ends up unexplainable six months later.

### Gate 2 — Build in slices, audit after each one

A slice is one coherent unit: a data sheet, a calculated column, a lookup
block, a summary table. After each slice:

```bash
python3 scripts/audit.py libro.xlsx \
  --ledger .precision-forge/ledger.json \
  --json .precision-forge/last.json --fail-on high
```

Exit code 1 means there is something at or above `high`. Work it before writing
the next slice.

The audit's sharpest instrument is pattern comparison: it converts every
formula to a relative (R1C1) normal form, so all the cells that were filled
from one source formula collapse to the same string, and the one that was
edited by hand stands out. This is what catches the hardcoded row, the
half-updated constant, the pasted value sitting in the middle of a live column
— the defects that are invisible to reading because reading shows you what you
expect to see.

`references/checks.md` documents every check: what it detects, why it matters,
and when it is a legitimate exception rather than a defect. Read it when a
finding is unfamiliar or when you are about to dismiss one.

### Gate 3 — Prove the numbers

A workbook written by a library contains no computed values at all. Every
formula in it is an untested claim until something evaluates it.

```bash
python3 scripts/recalc.py libro.xlsx --compare-cached --json .precision-forge/values.json
```

This computes every formula in pure Python — no Excel, no LibreOffice — and
reports two things: formulas that evaluate to an error, and formulas whose
stored value disagrees with the recomputed one. The second is how you catch a
number that was typed over a formula, which no static check can see.

### Gate 4 — Assert what the answer should be

Static checks prove the workbook is well-formed. They cannot prove it is
*right*. For that, state the answer independently and compare:

```bash
echo '{"Modelo!D2": 652, "Modelo!B14": 15330}' > .precision-forge/expected.json
python3 scripts/recalc.py libro.xlsx --expect .precision-forge/expected.json
```

Derive the expected values from the business logic — by hand, or in Python from
the source data — never by reading them off the spreadsheet you are testing.
A test that copies its expectations from the thing under test proves only that
the file can be read.

When one fails, decide which side is wrong before touching anything. Editing
the expectation to make the test pass is not a fix; it is deleting the test.

### Gate 5 — Presentation and final sweep

Run the full audit once more at `--fail-on low`, then check what no script can:
column widths (values rendering as `###`), number formats, print area and page
breaks, frozen panes, chart axes and series, sheet protection, and whether the
input cells are visually distinguishable from calculated ones.

### Gate 6 — Close the loop

```bash
python3 scripts/ledger.py --path .precision-forge/ledger.json record .precision-forge/last.json
```

This is what makes the next build better than this one.

## The correction protocol

For every finding, in severity order, one of exactly three outcomes — and the
decision is explicit, never a shrug:

**It is a defect.** Fix the cause, not the symptom. Wrapping a `#DIV/0!` in
`IFERROR` does not fix the division; it hides it and every other failure that
cell will ever have. Then look for siblings: a defect found in one cell of a
filled block was almost certainly filled everywhere, so check the block, not
the cell.

**It is a deliberate exception.** A total row that breaks the column pattern, a
whole-column reference in a sheet designed to grow. Say why, in the workbook —
a cell comment or a documented convention — because an unexplained exception is
indistinguishable from a defect to the next person, including future you.

**It is a false positive.** The check is wrong about this project. Mute it *by
signature, with a reason*:

```bash
python3 scripts/ledger.py --path .precision-forge/ledger.json \
  mute "WHOLE_COLUMN_REF" --reason "sheets here are designed to grow"
```

The reason matters more than the mute. A muted signature never asks again, so
six months from now the reason is the only thing standing between a real defect
and silence.

**After every fix, re-run the audit.** Fixes introduce defects at a rate that
surprises people — the most common being a formula corrected in one cell and
never filled back down, which turns one wrong row into a pattern break. The
gate is not passed until the run is clean.

## How it learns

The skill file is static text; it cannot rewrite itself between sessions. The
learning lives in `.precision-forge/ledger.json`, which the auditor reads on
every run, and it is real in three concrete ways:

1. **Priority.** Recorded findings accumulate counts. `ledger.py report` ranks
   them, so the watchlist you read at Gate 0 is ordered by what has genuinely
   cost this project time.
2. **Suppression.** Muted signatures stop firing — permanently, across
   sessions. The auditor gets quieter and more trustworthy as it is corrected.
3. **Extension.** New checks can be added, and they run alongside the built-in
   catalogue from the next audit on:

```bash
python3 scripts/ledger.py --path .precision-forge/ledger.json rule add \
  --id PF_OLD_VAT --pattern '\*\s*0\.19' \
  --message "Superseded VAT rate; current is 0.21" --severity critical
```

When you find a defect the catalogue missed, that is the signal to add a rule.
Ask: what is the *shape* of this mistake, independent of this workbook? A rule
keyed to the shape catches it in every future file; one keyed to this file's
cell addresses catches nothing ever again. Signatures deliberately exclude cell
addresses for the same reason — a defect that moves from E4 to E9 is the same
defect.

## What this cannot see

Say this plainly rather than letting the audit imply more than it proves:

- **Pivot tables, Power Query, charts and VBA** are not evaluated. They are
  read as structure, not executed.
- **The recalculation engine covers common functions**, not the entire Excel
  surface. If it cannot evaluate a formula it reports nothing for that cell —
  absence of a finding there is not a pass.
- **Business correctness is out of scope for every static check.** A model can
  be flawless in construction and still use the wrong discount rate. Only Gate 4
  touches this, and only for the values you actually assert.
- **Very large workbooks** make recalculation slow. Audit statically as often as
  you like; recalculate at checkpoints.

When a check does not run, report it as not run. A verification you claimed but
did not perform is worse than one you skipped honestly, because it spends trust
you have not earned.

## Command reference

| Purpose | Command |
|---|---|
| Audit after a slice | `audit.py FILE --ledger L --json OUT --fail-on high` |
| Full sweep incl. advisories | `audit.py FILE --ledger L --fail-on low` |
| Machine-readable findings | `audit.py FILE --format json` |
| Recalculate and find errors | `recalc.py FILE` |
| Detect stale stored values | `recalc.py FILE --compare-cached` |
| Golden test | `recalc.py FILE --expect expected.json` |
| Read the watchlist | `ledger.py --path L report` |
| Record a run | `ledger.py --path L record findings.json` |
| Mute a false positive | `ledger.py --path L mute SIG --reason "..."` |
| Add a learned check | `ledger.py --path L rule add --id ID --pattern RE --message M` |

Exit codes: `0` clean, `1` findings at/above the threshold, `2` the file could
not be read. Gate your build loop on them.

`references/checks.md` — the full check catalogue and how to resolve each one.
`references/recipes.md` — construction patterns that prevent these defects
instead of detecting them.
