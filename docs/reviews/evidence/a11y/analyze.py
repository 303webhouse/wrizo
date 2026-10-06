"""Summarise run/results.json into the tables the accessibility report needs."""
import json, sys, collections, os
here = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(here, "run", "results.json")))
R = d["results"]; E = d["escResults"]
out = []
P = out.append

# 1 · axe violations by rule
P("## AXE VIOLATIONS BY RULE")
agg = collections.OrderedDict()
for r in R:
    for v in (r.get("axe") or {}).get("violations", []):
        a = agg.setdefault(v["id"], {"impact": v["impact"], "help": v["help"], "where": set(), "screens": set(), "nodes": 0, "ex": []})
        a["where"].add(f'{r["theme"]}/{r["vp"]}'); a["screens"].add(r["screen"]); a["nodes"] += v["count"]
        for n in v["nodes"]:
            if len(a["ex"]) < 8 and n["target"] not in [e["target"] for e in a["ex"]]:
                a["ex"].append({**n, "screen": r["screen"], "theme": r["theme"], "vp": r["vp"]})
order = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}
for k, a in sorted(agg.items(), key=lambda x: (order.get(x[1]["impact"], 9), -len(x[1]["screens"]))):
    P(f'\n### {k} [{a["impact"]}] {a["help"]} | screens={len(a["screens"])} nodes={a["nodes"]} | {sorted(a["where"])}')
    P("   screens: " + ", ".join(sorted(a["screens"])))
    for n in a["ex"]:
        P(f'   - [{n["theme"]}/{n["vp"]}/{n["screen"]}] {n["target"][:80]} :: {n["html"][:110]} :: {n["summary"][:230]}')

# colour contrast detail
P("\n## COLOR-CONTRAST NODES (axe)")
seen = set()
for r in R:
    for v in (r.get("axe") or {}).get("violations", []):
        if v["id"] != "color-contrast": continue
        for n in v["nodes"]:
            dd = n.get("data") or {}
            key = (r["theme"], r["vp"], n["target"])
            if key in seen: continue
            seen.add(key)
            P(f'   {r["theme"]:7} {r["vp"]:7} {r["screen"]:18} {n["target"][:48]:48} fg={dd.get("fgColor")} bg={dd.get("bgColor")} ratio={dd.get("contrastRatio")} need={dd.get("expectedContrastRatio")} size={dd.get("fontSize")} {dd.get("fontWeight")}')

# 2 · hit targets: rail + mode tabs
P("\n## RAIL + MODE TABS (w x h)")
for r in R:
    if r["screen"] not in ("page-freewrite", "board"): continue
    rows = [t for t in (r.get("targets") or []) if any(c in (t.get("cls") or "") for c in ("wz-strip-item", "desk-mode-tab", "page-plan-door", "desk-rail-item", "sprint-toggle-btn", "board-mode-tab", "board-door"))]
    P(f'\n  {r["theme"]}/{r["vp"]}/{r["screen"]}')
    for t in rows:
        P(f'    {t["name"][:14]:14} {t["cls"][:34]:34} {t["rect"]["w"]:>6} x {t["rect"]["h"]:<6} 44:{"ok" if not t["under44"] else "UNDER"}  24:{"ok" if not t["under24"] else ("spacing-ok" if t.get("spacingOK") else "FAIL")}')

# all undersized
P("\n## ALL TARGETS UNDER 24 (by name/class; spacing exception applied)")
u = collections.OrderedDict()
for r in R:
    for t in r.get("targets") or []:
        if not t["under24"]: continue
        k = (t["name"][:26], t["cls"][:40], r["vp"])
        e = u.setdefault(k, {"sizes": set(), "screens": set(), "spacingOK": set(), "themes": set()})
        e["sizes"].add(f'{t["rect"]["w"]}x{t["rect"]["h"]}'); e["screens"].add(r["screen"]); e["spacingOK"].add(bool(t.get("spacingOK"))); e["themes"].add(r["theme"])
for (nm, cl, vp), e in u.items():
    P(f'   {vp:7} {nm:26} {cl:40} {sorted(e["sizes"])[:3]} spacingOK={sorted(e["spacingOK"])} screens={len(e["screens"])} themes={sorted(e["themes"])}')
P("\n## TARGET COUNTS (visible interactive, per screen)")
for r in R:
    ts = r.get("targets") or []
    if not ts: continue
    P(f'   {r["theme"]:7} {r["vp"]:7} {r["screen"]:20} total={len(ts):3} under44={sum(t["under44"] for t in ts):3} under24={sum(t["under24"] for t in ts):3} fail24={sum(t["under24"] and not t.get("spacingOK") for t in ts):3}')

# 3 · keyboard walks
P("\n## KEYBOARD WALKS")
for r in R:
    w = r.get("walk")
    if not w: continue
    stops = [s for s in w if not s.get("body") and not s.get("trapped") and not s.get("repeat")]
    inv = [s for s in stops if (not s.get("inView")) or s.get("opacity", 1) <= 0.1 or not s.get("hit")]
    noind = [s for s in stops if not s.get("indicator")]
    trap = [s for s in w if s.get("trapped")]
    cyc = [s for s in w if s.get("cycledTo") is not None]
    P(f'\n  {r["theme"]}/{r["vp"]}/{r["screen"]}: stops={len(stops)} invisible={len(inv)} no-indicator={len(noind)} trapped={bool(trap)} cycled={bool(cyc)}')
    for s in stops[:60]:
        flag = []
        if s in inv: flag.append(f'INVISIBLE(op={s.get("opacity")},inView={s.get("inView")},hit={s.get("hit")})')
        if s in noind: flag.append("NO-INDICATOR")
        P(f'     {s["i"]:2} {s["tag"]:8} {str(s.get("role") or ""):8} {s["name"][:28]:28} {s["cls"][:36]:36} {s["rect"]["w"]}x{s["rect"]["h"]} {" ".join(flag)}')
    for t in trap: P(f'     TRAP: after Escape+Tab -> {t.get("afterEscapeTab")}')

# 4 · hidden focusables
P("\n## FOCUSABLE BUT NOT VISIBLE (per screen, first 12)")
for r in R:
    h = r.get("hiddenFocusable") or []
    if not h: continue
    P(f'  {r["theme"]}/{r["vp"]}/{r["screen"]}: {len(h)}  ' + "; ".join(f'{x["name"][:18]}({x["cls"][:22]} op={x["opacity"]} inView={x["inView"]} hit={x["hit"]})' for x in h[:12]))

# 5 · doors
P("\n## DOORS (keyboard open / Esc)")
for e in E:
    e2 = {k: v for k, v in e.items() if k not in ("tabStops",)}
    P("  " + json.dumps(e2)[:900])

# 6 · contrast samples + tokens
P("\n## CONTRAST SAMPLES")
done = set()
for r in R:
    c = r.get("contrast")
    if not c: continue
    for s in c["samples"]:
        k = (r["theme"], r["vp"], s["label"])
        if k in done: continue
        done.add(k)
        large = s["fontSize"] >= 24 or (s["fontSize"] >= 18.66 and str(s["weight"]) in ("700", "800", "900", "bold"))
        need = 3 if large else 4.5
        P(f'   {r["theme"]:7} {r["vp"]:7} {s["label"][:34]:34} fg={s["fg"]:22} bg={s["bg"]:18} ratio={s["ratio"]:5} size={s["fontSize"]:5} op={s["opacity"]} {"PASS" if s["ratio"] >= need else "FAIL"}(>= {need}) {"[bg image/gradient]" if s["bgImage"] else ""} ({r["screen"]})')
P("\n## TOKENS")
tk = {}
for r in R:
    c = r.get("contrast")
    if c and r["theme"] not in tk: tk[r["theme"]] = c["tokens"]
for th, t in tk.items(): P(f"   {th}: " + json.dumps(t))

open(os.path.join(here, "run", "summary.txt"), "w").write("\n".join(out))
print("\n".join(out)[:int(sys.argv[1]) if len(sys.argv) > 1 else 10**9])
