#!/usr/bin/env python3
"""Precision Forge ledger -- the part that remembers.

A skill file is static text; it cannot rewrite itself between sessions. What it
can do is keep a ledger next to the project and consult it before every build.
That is where the learning actually lives:

  * every finding recorded here increments a counter, so the checks that keep
    biting this project rise to the top of the watchlist and get looked at first
  * every finding you dismiss as a false positive is muted by signature, so the
    auditor stops crying wolf about it -- permanently, across sessions
  * every rule you add becomes a new check the auditor runs from then on, which
    is how the catalogue grows past what was shipped with it

Signatures deliberately exclude cell addresses. A defect that moves from E4 to
E9 is the same defect; one that keys on the address would be learned twice and
recognised never.

Usage:
  ledger.py init
  ledger.py record findings.json
  ledger.py mute   "NARROW_COLUMN::..."   [--reason "..."]
  ledger.py unmute "NARROW_COLUMN::..."
  ledger.py note   "PATTERN_BREAK::..."   "VAT rate diverged again in row 40"
  ledger.py rule add --id PF_VAT --pattern "\\*0\\.19" --message "Old VAT rate" --severity high
  ledger.py rule list | ledger.py rule rm PF_VAT
  ledger.py report [--top 10]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

DEFAULT_PATH = os.path.join(".precision-forge", "ledger.json")


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def empty():
    return {"version": 1, "created_at": now(), "updated_at": now(),
            "patterns": {}, "muted": {}, "rules": {},
            "stats": {"runs": 0, "findings_total": 0, "by_check": {}}}


def load(path):
    if not os.path.exists(path):
        return empty()
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    for k, v in empty().items():
        data.setdefault(k, v)
    return data


def save(path, data):
    data["updated_at"] = now()
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)


def cmd_init(args):
    if os.path.exists(args.path):
        print("ledger already exists at %s" % args.path)
        return 0
    save(args.path, empty())
    print("ledger created at %s" % args.path)
    return 0


def cmd_record(args):
    data = load(args.path)
    with open(args.findings, encoding="utf-8") as fh:
        report = json.load(fh)
    findings = report.get("findings", report if isinstance(report, list) else [])
    data["stats"]["runs"] += 1
    new = 0
    for f in findings:
        if f.get("severity") == "info":
            continue
        sig = f.get("signature") or f.get("check")
        if not sig:
            continue
        entry = data["patterns"].get(sig)
        if entry is None:
            entry = {"check": f.get("check", ""), "severity": f.get("severity", ""),
                     "occurrences": 0, "first_seen": now(), "last_seen": now(),
                     "examples": [], "note": ""}
            data["patterns"][sig] = entry
            new += 1
        entry["occurrences"] += 1
        entry["last_seen"] = now()
        entry["severity"] = f.get("severity", entry["severity"])
        loc = ("%s!%s" % (f.get("sheet", ""), f.get("cell", ""))).strip("!")
        if loc and loc not in entry["examples"]:
            entry["examples"] = (entry["examples"] + [loc])[-5:]
        data["stats"]["findings_total"] += 1
        by = data["stats"]["by_check"]
        by[f.get("check", "?")] = by.get(f.get("check", "?"), 0) + 1
    save(args.path, data)
    print("recorded %d finding(s), %d new signature(s) -> %s" % (len(findings), new, args.path))
    return 0


def cmd_mute(args):
    data = load(args.path)
    data["muted"][args.signature] = {"reason": args.reason or "", "muted_at": now()}
    save(args.path, data)
    print("muted %s" % args.signature)
    print("The auditor will not raise this signature again. Unmute if that turns out to be wrong.")
    return 0


def cmd_unmute(args):
    data = load(args.path)
    if data["muted"].pop(args.signature, None) is None:
        print("%s was not muted" % args.signature)
        return 1
    save(args.path, data)
    print("unmuted %s" % args.signature)
    return 0


def cmd_note(args):
    data = load(args.path)
    entry = data["patterns"].setdefault(args.signature, {
        "check": args.signature.split("::")[0], "severity": "", "occurrences": 0,
        "first_seen": now(), "last_seen": now(), "examples": [], "note": ""})
    entry["note"] = args.text
    save(args.path, data)
    print("noted against %s" % args.signature)
    return 0


def cmd_rule(args):
    data = load(args.path)
    if args.action == "add":
        try:
            re.compile(args.pattern)
        except re.error as exc:
            sys.stderr.write("invalid regex: %s\n" % exc)
            return 1
        data["rules"][args.id] = {"pattern": args.pattern, "message": args.message,
                                  "severity": args.severity, "added_at": now()}
        save(args.path, data)
        print("rule %s added; the auditor applies it from the next run on." % args.id)
    elif args.action == "rm":
        if data["rules"].pop(args.id, None) is None:
            print("no rule %s" % args.id)
            return 1
        save(args.path, data)
        print("rule %s removed" % args.id)
    else:
        if not data["rules"]:
            print("no learned rules yet")
        for rid, r in sorted(data["rules"].items()):
            print("%-14s [%s] /%s/  %s" % (rid, r.get("severity", "?"), r["pattern"], r.get("message", "")))
    return 0


def cmd_report(args):
    data = load(args.path)
    pats = data["patterns"]
    print("PRECISION FORGE LEDGER  %s" % os.path.abspath(args.path))
    print("  runs=%d  findings=%d  signatures=%d  muted=%d  rules=%d"
          % (data["stats"]["runs"], data["stats"]["findings_total"],
             len(pats), len(data["muted"]), len(data["rules"])))

    if pats:
        print("\nWATCHLIST -- what has actually bitten this project, worst first.")
        print("Check these before you write the block, not after.")
        ranked = sorted(pats.items(), key=lambda kv: (-kv[1]["occurrences"], kv[0]))
        for sig, e in ranked[:args.top]:
            print("\n  x%-3d %-26s %s" % (e["occurrences"], e["check"], sig))
            if e["examples"]:
                print("       seen at: %s" % ", ".join(e["examples"]))
            if e.get("note"):
                print("       note: %s" % e["note"])
    else:
        print("\nNo history yet. Record an audit to start building the watchlist.")

    if data["rules"]:
        print("\nLEARNED RULES -- checks this project added on top of the catalogue:")
        for rid, r in sorted(data["rules"].items()):
            print("  %-14s [%s] /%s/  %s" % (rid, r.get("severity", "?"), r["pattern"], r.get("message", "")))

    if data["muted"]:
        print("\nMUTED -- known false positives, suppressed on purpose:")
        for sig, m in sorted(data["muted"].items()):
            print("  %s%s" % (sig, ("  (%s)" % m["reason"]) if m.get("reason") else ""))
    return 0


def main():
    ap = argparse.ArgumentParser(description="Precision Forge ledger")
    ap.add_argument("--path", default=DEFAULT_PATH)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init").set_defaults(func=cmd_init)

    p = sub.add_parser("record"); p.add_argument("findings"); p.set_defaults(func=cmd_record)
    p = sub.add_parser("mute"); p.add_argument("signature"); p.add_argument("--reason")
    p.set_defaults(func=cmd_mute)
    p = sub.add_parser("unmute"); p.add_argument("signature"); p.set_defaults(func=cmd_unmute)
    p = sub.add_parser("note"); p.add_argument("signature"); p.add_argument("text")
    p.set_defaults(func=cmd_note)

    p = sub.add_parser("rule")
    p.add_argument("action", choices=["add", "rm", "list"])
    p.add_argument("--id"); p.add_argument("--pattern"); p.add_argument("--message", default="")
    p.add_argument("--severity", default="medium",
                   choices=["critical", "high", "medium", "low"])
    p.set_defaults(func=cmd_rule)

    p = sub.add_parser("report"); p.add_argument("--top", type=int, default=10)
    p.set_defaults(func=cmd_report)

    args = ap.parse_args()
    if args.cmd == "rule" and args.action == "add" and not (args.id and args.pattern):
        sys.stderr.write("rule add needs --id and --pattern\n")
        return 1
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
