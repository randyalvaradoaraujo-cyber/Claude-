# Construction recipes

The audit catches defects. These patterns stop them being written in the first
place, which is cheaper. Read this before building a new workbook; consult the
relevant section when a gate keeps failing on the same check.

## Separate the three layers

Keep raw data, calculation and presentation apart — ideally on different
sheets, at minimum in different regions with a visible boundary.

The reason is not tidiness. When inputs and outputs are interleaved, there is no
way to tell by looking whether a number is something someone typed or something
the workbook derived, so every future edit is a guess. Separation makes
`CONSTANT_IN_FORMULA_RUN` structurally impossible in the calculation layer: any
hard value there is, by construction, a defect.

Give input cells a distinct fill colour and say so in a legend. It costs one
minute and it is the difference between a model someone can safely edit and one
they can only admire.

## Never bury a constant in a formula

`=D2*0.21` is a defect waiting for the VAT rate to change. It will change, the
update will be done with find-and-replace, and one row will be missed — that is
the single most common origin of `PATTERN_BREAK`.

Put the rate in a labelled cell and reference it: `=D2*$Parametros.$B$1`, or
better, define the name `IVA` and write `=D2*IVA`. Named references survive
inserted rows and read as intent rather than arithmetic.

The exception is a constant that is genuinely part of the mathematics — the 12
in a monthly-to-annual conversion, the 100 in a percentage. Those are not
policy and will not change.

## Anchor deliberately, in both dimensions

Before filling a formula, decide for each reference what should move:

| Intent | Form |
|---|---|
| Moves with the row, stays in its column | `B2` |
| Fixed cell, never moves | `$B$2` |
| Column fixed, row moves (filling right across a row block) | `$B2` |
| Row fixed, column moves (filling down a column block) | `B$2` |
| Range that grows as you fill down (running totals) | `$D$2:D2` |

Lookup tables are always fully anchored. An unanchored `table_array` is the
`VLOOKUP_UNANCHORED` finding, and it fails progressively: the first rows are
right, the last rows are wrong, so spot-checking the top of the column confirms
a model that is broken at the bottom.

## Lookup discipline

- Pass the fourth argument to `VLOOKUP` **every time**, even when exact match
  is what you want. Explicit `FALSE` documents the intent; an omitted argument
  is indistinguishable from an oversight.
- Prefer `INDEX`/`MATCH` or `XLOOKUP` where available: they do not break when a
  column is inserted into the table, which `VLOOKUP`'s positional
  `col_index_num` does, silently and immediately.
- Verify key uniqueness *before* building the lookup, not after the numbers
  look wrong. A duplicate key does not error; it returns the first match.
- `TRIM` and normalise case on both sides of a join. Whitespace and casing are
  the two reasons "identical" values do not match.

## Totals that keep working

Write aggregates over the whole block from the start, including rows you
intend to add: `=SUM(D2:D1000)` over a block that currently ends at row 13 is
safer than `=SUM(D2:D13)` that someone must remember to extend.

Better still, use a real Excel table (`ListObject`); structured references grow
on their own, which removes `TOTAL_RANGE_MISMATCH` as a possibility rather than
as a check.

Cross-foot wherever the structure allows it: if a grid totals by row and by
column, the two grand totals must agree, and a cell that asserts
`=ROUND(total_rows - total_cols, 6) = 0` turns a silent inconsistency into a
visible one.

## Determinism

Anything whose value depends on *when* the file is opened cannot be tested and
cannot be reconciled against a previous copy. Confine `TODAY`/`NOW` to a single
labelled "report date" cell and reference it everywhere else; freeze it to a
literal before archiving or sending.

Avoid `INDIRECT` and `OFFSET` where `INDEX` will do. Beyond being volatile, they
are invisible to dependency tracing, so nothing — not Excel's own tools, not
this auditor — can tell you what a change will break.

## Errors: handle, do not hide

`IFERROR(x, "")` is a decision to never find out what went wrong. Prefer:

- fixing the precedent, if the error means something is genuinely broken;
- `IFNA(x, "no match")` when a missing lookup is an expected, meaningful state,
  because it handles that one case and still surfaces everything else;
- a sentinel you can filter and count, so "how many rows failed" is a question
  the workbook can answer.

## Build order

Bottom-up, auditing between each step, because each layer's correctness depends
on the one below it and a defect in the foundation multiplies as you build:

1. Raw data in, validated (Gate 1).
2. Named ranges and parameters.
3. Calculated columns, one at a time.
4. Lookups and cross-sheet references.
5. Aggregates and summaries.
6. Charts and formatting.
7. Protection and print setup.

Resist writing the dashboard first. It is the most satisfying part and the most
expensive to rework when the layer beneath it moves.

## Before handing it over

- Every input cell is visually marked and there is a legend saying so.
- Every deliberate exception to a pattern carries a comment explaining itself.
- Assumptions and their sources are written down *in the workbook*, not in the
  message that accompanied it — messages get lost, files get forwarded.
- A golden test exists for the headline numbers, so the next person can tell
  whether their change broke anything.
- The audit runs clean at `--fail-on low`, or every remaining finding has a
  recorded reason.
