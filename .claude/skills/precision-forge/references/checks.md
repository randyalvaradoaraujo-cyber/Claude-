# Check catalogue

Every check the auditor runs, what it actually detects, why it is worth
stopping for, and — the part that matters most in practice — when it is a
legitimate exception rather than a defect. Read the relevant entry before
dismissing a finding.

Findings carry a **signature** rather than an address, because a defect that
moves from `E4` to `E9` is the same defect. Signatures are what the ledger
counts, mutes and ranks.

## Contents

- [Critical](#critical) — the workbook is producing wrong output right now
- [High](#high) — very likely wrong, or wrong as soon as anything changes
- [Medium](#medium) — fragile, non-deterministic, or slow
- [Low](#low) — advisory
- [Info](#info) — states of the audit itself

---

## Critical

### ERROR_LITERAL
An error value (`#REF!`, `#VALUE!`, `#DIV/0!`, `#N/A`, `#NAME?`, `#NULL!`,
`#NUM!`, `#SPILL!`, `#CALC!`) appears in a formula or in a stored value.

Errors propagate: one `#N/A` in a column poisons every total above it. Trace
the precedent that produces it and repair it there. `IFERROR` is a legitimate
tool only when the error is an *expected, documented* state — "this SKU has no
price yet" — and even then prefer a sentinel you can filter on over a blank.

### CALC_ERROR *(recalc)*
The formula was evaluated and produced an error, even though the file showed
no error value. This is the normal case for a workbook written by a library:
nothing had ever evaluated it. Same resolution as `ERROR_LITERAL`.

### VALUE_DRIFT *(recalc --compare-cached)*
The value stored in the cell disagrees with the value its own formula produces.

Almost always one of two things: someone typed a number over a formula, or the
file was saved without recalculating. Both mean the visible number is not
derived from the inputs any more. No static check can see this — the formula
reads correctly and the number reads plausibly.

### BAD_SHEET_REF
A formula references a sheet that does not exist. Usually a rename, sometimes a
trailing space in the sheet name. Guaranteed `#REF!`.

### BROKEN_NAME
A defined name resolves to `#REF!` or to a missing sheet. Named ranges survive
the deletion of what they pointed at, so a stale name silently poisons every
formula that uses it, in every sheet, with no visible link to the cause.

### SELF_REF
A cell references itself: a circular reference. Excel either shows 0 or an
iterative-calculation result that depends on settings, which means the file
computes differently on different machines.

### VLOOKUP_COL_OUT_OF_RANGE
`col_index_num` exceeds the width of `table_array`. Returns `#REF!` on every
row, deterministically. Usually a range that was narrowed after the formula was
written.

### VLOOKUP_APPROX *(missing 4th argument)*
`VLOOKUP`/`HLOOKUP` with no `range_lookup` argument defaults to **approximate
match**. On an unsorted key it returns whatever row it lands on — a plausible
value from the wrong record, with no error and no visual cue. This is the
single most expensive silent defect in ordinary spreadsheet work.

Fix by adding `FALSE` (or `0`). *Legitimate exception:* banded lookups — tax
brackets, volume discounts, grade boundaries — where approximate match against
a sorted-ascending column is the intended behaviour. When that is the case,
pass `TRUE` explicitly rather than omitting the argument, so the intent is
readable. The auditor grades explicit `TRUE` as `high` rather than `critical`
for exactly this reason.

### EXPECT_MISMATCH / EXPECT_MISSING *(recalc --expect)*
A value you asserted does not match what the workbook computes, or the cell
produced nothing.

Resolve which side is wrong before editing anything. Adjusting the expectation
to make the test pass is deleting the test.

---

## High

### PATTERN_BREAK
One formula in a filled block differs from the pattern its neighbours share.

The auditor converts each formula to a relative (R1C1) normal form, so cells
filled from one source formula collapse to an identical string. Note that this
handles growing ranges correctly: `=SUM($D$2:D5)` and `=SUM($D$2:D6)` normalize
the same, because the anchored end is absolute and the moving end is relative.
A break therefore means a genuine structural difference — a changed constant, a
different reference shape, an extra term.

*Legitimate exception:* a deliberate special case. Document it in the cell, and
consider whether it belongs in a labelled input instead.

### CONSTANT_IN_FORMULA_RUN
A hard value sits inside a block that is otherwise formulas. It will not update
when its inputs change, so the workbook is right today and wrong tomorrow.

*Legitimate exception:* a genuine input that belongs to the row. If so, move it
to its own labelled column so it reads as an input rather than hiding as a
broken calculation.

### TOTAL_RANGE_MISMATCH
An aggregate at the edge of a block does not span the whole block — typically
`=SUM(D2:D10)` under a block that now runs to row 13.

This is what happens when rows are added after the total was written. The total
keeps working; it is just quietly low. Nothing about it looks wrong.

### NUMBER_AS_TEXT
Numeric-looking text in a column that is otherwise numeric. `SUM` skips it and
numeric lookups never match it, so totals are silently low and joins silently
drop rows. Common when data arrives from CSV, PDF or a web paste.

### LOOKUP_KEY_DUPLICATE
The first column of a range actually used as a `VLOOKUP` `table_array` contains
duplicate keys. `VLOOKUP` returns the first hit, so some rows take the wrong
record — deterministically, and invisibly.

Only ranges that are genuinely looked up are checked, which keeps this from
firing on every column that happens to repeat values.

### VLOOKUP_UNANCHORED
`table_array` is not anchored with `$`. Filled down, the lookup range slides and
rows fall out of the bottom of the search, so later rows return `#N/A` or the
wrong record. Anchor it: `$A$2:$C$500`.

---

## Medium

### TRAILING_SPACE
Leading or trailing whitespace in a text cell. Exact-match lookups fail on
values that are visually identical. `TRIM` at the source, not at each use.

### EXTERNAL_LINK
A formula points at another workbook. It breaks when the file moves, it cannot
be recalculated in isolation, and it silently serves a cached value in the
meantime. Import the data, or document the dependency deliberately.

### VOLATILE
`NOW`, `TODAY`, `RAND`, `RANDBETWEEN`, `RANDARRAY`, `OFFSET`, `INDIRECT`,
`CELL`, `INFO`. These recalculate on every change, which makes the workbook
non-deterministic — the same inputs produce different saved values, and any
golden test against them is meaningless.

*Legitimate exception:* one documented cell holding "report date". Keep it to
one, reference it everywhere else, and freeze it before archiving.
`INDIRECT`/`OFFSET` additionally defeat dependency tracing, so prefer `INDEX`
where possible.

### WHOLE_COLUMN_REF
`A:A`-style references scan every row of the sheet. Bound the range, or use a
structured table reference that grows on its own.

*Legitimate exception:* sheets explicitly designed to grow with unpredictable
row counts. Mute it with that reason if it is a project-wide convention.

### MERGED_IN_DATA
Merged cells spanning data rows break sorting, filtering, structured references
and most programmatic access. For the visual effect, use "Center Across
Selection", which looks identical and merges nothing.

---

## Low

### IFERROR_BLANK_MASK
`IFERROR(..., "")` hides every failure mode, including ones you did not
anticipate, and leaves a blank that reads as "no data" rather than "something
broke". Handle the specific error, or return a sentinel you can filter on.

### NARROW_COLUMN
A column looks too narrow for its widest numeric value, which renders as `###`
in Excel. The width estimate is a heuristic and does not know the applied
number format, so treat it as a prompt to look rather than a verdict.

---

## Info

### NO_CACHED_VALUES
The workbook has formulas but no computed values — normal for a file just
written by a library. Every value-level check was skipped. Run `recalc.py`
before treating any number in the file as verified.

### `<CHECK>::truncated`
More findings of one kind than the display limit. Fix the shown ones and re-run;
they are usually all the same root cause repeated down a column.

---

## Learned rules

Rules added through `ledger.py rule add` appear under their own id with the
severity you assigned. They are regular expressions matched against formula
text, so they are best aimed at the *shape* of a mistake — a superseded
constant, a banned function, a naming convention — rather than at one file's
addresses.
