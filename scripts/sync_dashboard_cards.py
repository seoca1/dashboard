#!/usr/bin/env python3
"""
sync_dashboard_cards.py — Sync Fiction derivative stories to dashboard HTML cards.

ADR-0006 #5 (build_pipeline) 후속: 대시보드 HTML 카드를 Fiction frontmatter 기반으로
자동 생성/갱신. 16개 누락 카드 생성 + 6개 확장본 카드의 메타데이터(word_count, character-badge)
갱신.

Usage:
    python3 Game/dashboard/scripts/sync_dashboard_cards.py --all       # 모든 EN 파일
    python3 Game/dashboard/scripts/sync_dashboard_cards.py --missing  # 누락만
    python3 Game/dashboard/scripts/sync_dashboard_cards.py --stem <stem>
    python3 Game/dashboard/scripts/sync_dashboard_cards.py --update-existing  # 메타데이터만 갱신
    python3 Game/dashboard/scripts/sync_dashboard_cards.py --dry-run
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FICTION_EN = ROOT / "Fiction" / "derivative" / "sprawl-trilogy" / "short-stories" / "en"
FICTION_KO = ROOT / "Fiction" / "derivative" / "sprawl-trilogy" / "short-stories" / "ko"
DASH_DIR = ROOT / "Game" / "wet_run" / "dashboard" / "stories" / "short-stories"
GAME_MISSIONS = ROOT / "Game" / "wet_run" / "prototype" / "data" / "missions" / "missions.json"

CHAR_LABELS = {
    "novice": ("Case (K)", "케이 (K)", "case"),
    "veteran": ("Sil", "실", "sil"),
    "heretic": ("Kas", "카스", "kas"),
    "suit": ("3Jane", "3제인", "3jane"),
}


def stem_from_filename(p: Path) -> str:
    name = p.stem
    m = re.match(r"^\d{4}-\d{2}-\d{2}_(.+)$", name)
    return m.group(1) if m else name


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}
    yaml_text = parts[1]
    try:
        import yaml
        return yaml.safe_load(yaml_text) or {}
    except ImportError:
        result: dict = {}
        for line in yaml_text.strip().split("\n"):
            line = line.rstrip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$", line)
            if m:
                result[m.group(2)] = m.group(3).strip().strip('"').strip("'")
        return result


def get_lang_value(field, lang: str) -> str:
    if isinstance(field, dict):
        for k in (lang, "en", "ko"):
            v = field.get(k)
            if v:
                return str(v)
        for v in field.values():
            if v:
                return str(v)
        return ""
    return str(field or "")


def strip_body_to_html(text: str) -> str:
    """Convert Markdown body to HTML, preserving only essential structure."""
    parts = text.split("---", 2)
    body = parts[2] if len(parts) >= 3 else text
    lines = body.split("\n")
    html_lines = []
    in_code = False
    in_list = False

    def close_list():
        nonlocal in_list
        if in_list:
            html_lines.append("</ul>")
            in_list = False

    for line in lines:
        s = line.rstrip()
        if s.startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        if s.startswith("# ") or s.startswith("## "):
            close_list()
            html_lines.append(f"<h2>{s.lstrip('#').strip()}</h2>")
        elif s.startswith(">"):
            close_list()
            quote_text = s.lstrip(">").strip()
            html_lines.append(f"<blockquote><p>{quote_text}</p></blockquote>")
        elif s == "---":
            close_list()
            html_lines.append("<hr>")
        elif s.startswith("- "):
            if not in_list:
                html_lines.append("<ul>")
                in_list = True
            html_lines.append(f"<li>{s[2:].strip()}</li>")
        elif s.strip() == "":
            close_list()
        else:
            close_list()
            html_lines.append(f"<p>{s}</p>")
    close_list()
    return "\n".join(html_lines)


def render_card(*, lang: str, fm: dict, stem: str, body_html: str) -> str:
    """Generate dashboard HTML card."""
    title = get_lang_value(fm.get("title"), lang)
    if not title:
        title = stem.replace("_", " ").title()

    subtitle = get_lang_value(fm.get("subtitle"), lang)
    series = get_lang_value(fm.get("series"), lang)
    gi = fm.get("game_integration", {}) or {}
    if not isinstance(gi, dict):
        gi = {}

    char_ref = str(fm.get("character_ref", "")).lower()
    char_label_en, char_label_ko, char_wiki = CHAR_LABELS.get(char_ref, ("?", "?", "case"))
    char_label = char_label_en if lang == "en" else char_label_ko

    word_count_raw = str(fm.get("word_count", ""))
    m = re.search(r"(\d+)", word_count_raw.replace(",", ""))
    word_count = int(m.group(1)) if m else 0
    wc_str = f"{word_count} words" if word_count else "—"

    mission_id = gi.get("mission_id", "")
    arc_raw = gi.get("arc", "")
    arc_str = f"Arc {arc_raw}" if arc_raw and str(arc_raw).isdigit() else ""
    is_standalone = fm.get("standalone", False)
    if isinstance(is_standalone, str):
        is_standalone = is_standalone.lower() in ("true", "yes", "1")
    status_label = "Standalone" if is_standalone else (f"Mission: {mission_id}" if mission_id else "Original")
    arc_display = arc_str if arc_str else "—"

    other_lang = "ko" if lang == "en" else "en"
    other_href = f"{stem}.{other_lang}.html" if other_lang == "ko" else f"{stem}.html"

    badge_link = f"../../../../../Fiction/wiki/characters/{char_wiki}.md"

    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Roguelike Sprawl</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../glossary.css">
    <link rel="stylesheet" href="../../missions.css">
    <link rel="stylesheet" href="../../reading-position.css">
    <link rel="stylesheet" href="../../sync-scroll.css">
    <link rel="stylesheet" href="../../print.css" media="print">
    <link rel="stylesheet" href="../../reader-controls.css">
    <style>
        :root {{ --bg-color: #faf8f5; --text-color: #2c2c2c; --accent-color: #e94560; --meta-color: #666666; --font-serif: "Crimson Pro", "Source Serif 4", Georgia, serif; --max-width: 680px; --line-height: 1.8; }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        html {{ font-size: 18px; }}
        body {{ background-color: var(--bg-color); color: var(--text-color); font-family: var(--font-serif); line-height: var(--line-height); min-height: 100vh; -webkit-font-smoothing: antialiased; }}
        .container {{ max-width: var(--max-width); margin: 0 auto; padding: 4rem 2rem 8rem; }}
        .story-header {{ margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #e0ddd8; }}
        .character-badge {{ display: inline-block; font-family: monospace; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--accent-color); background: #1a1a2e15; padding: 0.25rem 0.75rem; border-radius: 2px; margin-bottom: 1rem; text-decoration: none; }}
        .story-title {{ font-size: 2.25rem; font-weight: 600; line-height: 1.2; margin-bottom: 0.5rem; }}
        .story-subtitle {{ font-size: 1.1rem; font-style: italic; color: var(--meta-color); }}
        .story-meta {{ margin-top: 1rem; font-size: 0.85rem; color: var(--meta-color); }}
        .story-meta span {{ margin-right: 1rem; }}
        .story-body {{ text-align: justify; hyphens: auto; }}
        .story-body p {{ margin-bottom: 1.5rem; }}
        .story-body h2 {{ font-size: 1.4rem; font-weight: 600; color: var(--accent-color); margin: 2.5rem 0 1rem; }}
        .story-body blockquote {{ font-style: italic; color: var(--meta-color); border-left: 3px solid var(--accent-color); padding-left: 1rem; margin: 2rem 0; }}
        .story-body hr {{ border: none; border-top: 1px solid #e0ddd8; margin: 2rem 0; }}
        .story-body ul {{ margin: 1.5rem 0; padding-left: 1.5rem; }}
        .story-body li {{ margin-bottom: 0.5rem; }}
        em {{ font-style: italic; }}
        strong {{ font-weight: 600; }}
        .story-footer {{ margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #e0ddd8; text-align: center; }}
        .story-footer p {{ font-size: 0.85rem; color: var(--meta-color); font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; }}
        .lang-indicator {{ position: fixed; top: 1rem; right: 1rem; font-family: monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--meta-color); background: var(--bg-color); padding: 0.25rem 0.5rem; border-radius: 2px; opacity: 0.7; }}
        .lang-indicator a {{ color: inherit; text-decoration: none; }}
        .lang-indicator a:hover {{ text-decoration: underline; }}
        @media (max-width: 600px) {{ html {{ font-size: 16px; }} .container {{ padding: 2rem 1.5rem 6rem; }} .story-title {{ font-size: 1.75rem; }} }}
    </style>
</head>
<body>
    <div class="lang-indicator">{lang.upper()} · <a href="{other_href}">{other_lang.upper()}</a></div>
    <div class="container">
        <header class="story-header">
            <a class="character-badge" href="{badge_link}" target="_blank" rel="noopener" title="Open wiki page">{char_label}</a>
            <h1 class="story-title">{title}</h1>
            {f'<p class="story-subtitle">{subtitle}</p>' if subtitle else ''}
            <div class="story-meta">
                <span>{wc_str}</span>
                <span>{series or 'Sprawl Trilogy'}</span>
                <span>{arc_display}</span>
                <span>{status_label}</span>
            </div>
        </header>
        <article class="story-body">
{body_html}
        </article>
        <footer class="story-footer">
            <p>Roguelike Sprawl — Derivative Fiction</p>
            <p>Based on William Gibson's Sprawl Trilogy</p>
        </footer>
    </div>
    <script src="../glossary.js"></script>
    <script src="../../reading-position.js"></script>
    <script src="../../sync-scroll.js"></script>
    <div class="print-footer">Roguelike Sprawl — Gibson Sprawl 3부작 기반 로그라이크 — 2026 © wiki/site attribution</div>
    <script src="../../reader-controls.js"></script>
    <script src="../../stats.js"></script>
</body>
</html>
"""


def find_card(stem: str, lang: str) -> Path | None:
    """Find existing card file (supports both naming conventions)."""
    candidates = [DASH_DIR / f"{stem}_{lang}.html"]
    if lang == "ko":
        candidates.append(DASH_DIR / f"{stem}.ko.html")
    else:
        candidates.append(DASH_DIR / f"{stem}.html")
    for c in candidates:
        if c.exists():
            return c
    return None


def generate_card(en_file: Path, *, lang: str, dry_run: bool = False) -> Path:
    text = en_file.read_text(encoding="utf-8", errors="ignore")
    fm = parse_frontmatter(text)
    stem = stem_from_filename(en_file)
    body_html = strip_body_to_html(text)
    card_html = render_card(lang=lang, fm=fm, stem=stem, body_html=body_html)
    out_path = DASH_DIR / f"{stem}.{lang}.html" if lang == "ko" else DASH_DIR / f"{stem}.html"
    if not dry_run:
        out_path.write_text(card_html, encoding="utf-8")
    return out_path


def update_existing_card(en_file: Path, *, dry_run: bool = False) -> tuple[Path, bool]:
    """Update only metadata (word_count, character-badge, status) of existing EN/KO cards.
    Preserves body content. Handles both naming conventions."""
    text = en_file.read_text(encoding="utf-8", errors="ignore")
    fm = parse_frontmatter(text)
    stem = stem_from_filename(en_file)

    title_en = get_lang_value(fm.get("title"), "en")
    title_ko = get_lang_value(fm.get("title"), "ko")
    word_count_raw = str(fm.get("word_count", ""))
    m = re.search(r"(\d+)", word_count_raw.replace(",", ""))
    word_count = int(m.group(1)) if m else 0
    char_ref = str(fm.get("character_ref", "")).lower()
    char_label_en, char_label_ko, char_wiki = CHAR_LABELS.get(char_ref, ("?", "?", "case"))
    gi = fm.get("game_integration", {}) or {}
    arc_raw = gi.get("arc", "")
    arc_str = f"Arc {arc_raw}" if arc_raw and str(arc_raw).isdigit() else ""
    is_standalone = fm.get("standalone", False)
    if isinstance(is_standalone, str):
        is_standalone = is_standalone.lower() in ("true", "yes", "1")
    mission_id = gi.get("mission_id", "")
    status_label = "Standalone" if is_standalone else (f"Mission: {mission_id}" if mission_id else "Original")
    series = get_lang_value(fm.get("series"), "en") or "Sprawl Trilogy"

    updated = []
    for lang, char_label, title in [("en", char_label_en, title_en), ("ko", char_label_ko, title_ko)]:
        card = find_card(stem, lang)
        if not card:
            continue
        ct = card.read_text(encoding="utf-8")
        original = ct

        ct = re.sub(r"<title>[^<]+</title>", f"<title>{title} — Roguelike Sprawl</title>", ct)
        ct = re.sub(
            r'<a class="character-badge"[^>]*>[^<]+</a>',
            f'<a class="character-badge" href="../../../../../Fiction/wiki/characters/{char_wiki}.md" target="_blank" rel="noopener" title="Open wiki page">{char_label}</a>',
            ct,
        )
        ct = re.sub(
            r"<h1 class=\"story-title\">[^<]+</h1>",
            f"<h1 class=\"story-title\">{title}</h1>",
            ct,
        )
        ct = re.sub(
            r"<div class=\"story-meta\">.*?</div>",
            f'<div class="story-meta"><span>{word_count} words</span><span>{series}</span><span>{arc_str or "-"}</span><span>{status_label}</span></div>',
            ct,
            count=1,
            flags=re.DOTALL,
        )

        if ct != original:
            if not dry_run:
                card.write_text(ct, encoding="utf-8")
            updated.append(card.name)

    return (None), bool(updated)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync dashboard cards from Fiction stories.")
    parser.add_argument("--all", action="store_true", help="process all EN stories")
    parser.add_argument("--missing", action="store_true", help="only generate missing cards")
    parser.add_argument("--update-existing", action="store_true", help="only update existing cards' metadata")
    parser.add_argument("--stem", help="process single stem")
    parser.add_argument("--dry-run", action="store_true", help="report changes without writing")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    if not args.all and not args.missing and not args.update_existing and not args.stem:
        args.all = True

    if args.stem:
        matches = list(FICTION_EN.glob(f"*_{args.stem}.md"))
        if not matches:
            print(f"stem not found: {args.stem}", file=sys.stderr)
            return 1
        en_files = matches
    else:
        en_files = sorted(FICTION_EN.glob("*.md"))

    results = {"created": [], "updated": [], "skipped": []}
    for en_file in en_files:
        stem = stem_from_filename(en_file)
        en_card = find_card(stem, "en")
        ko_card = find_card(stem, "ko")

        if args.update_existing:
            if en_card or ko_card:
                _, changed = update_existing_card(en_file, dry_run=args.dry_run)
                if changed:
                    results["updated"].append(stem)
                else:
                    results["skipped"].append(stem)
            else:
                results["skipped"].append(stem)
            continue

        if args.missing and en_card and ko_card:
            results["skipped"].append(stem)
            continue

        for lang in ("en", "ko"):
            path = generate_card(en_file, lang=lang, dry_run=args.dry_run)
        results["created"].append(stem)

    if args.json:
        import json as _json
        print(_json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print(f"Created: {len(results['created'])}")
        print(f"Updated: {len(results['updated'])}")
        print(f"Skipped: {len(results['skipped'])}")
        if results["created"]:
            print("\nCreated stems:")
            for s in results["created"][:20]:
                print(f"  + {s}")
        if results["updated"]:
            print("\nUpdated stems:")
            for s in results["updated"][:20]:
                print(f"  ~ {s}")
    return 0


if __name__ == "__main__":
    sys.exit(main())