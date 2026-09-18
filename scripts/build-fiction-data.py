#!/usr/bin/env python3
"""Build fiction-data.json with embedded markdown content for GitHub Pages."""

import json
import re
from pathlib import Path

# Script is at Game/dashboard/scripts/ — workspace root is 3 levels up
WORKSPACE = Path(__file__).resolve().parent.parent.parent.parent
FICTION = WORKSPACE / "Fiction"
SHORT_STORIES = FICTION / "derivative" / "sprawl-trilogy" / "short-stories"
WIKI_WORKS = FICTION / "wiki" / "works"
OUTPUT = Path(__file__).resolve().parent.parent / "public" / "data" / "fiction-data.json"


def extract_frontmatter(text: str) -> dict:
    """Extract YAML frontmatter from markdown."""
    m = re.match(r'^---\n(.*?)\n---\n', text, re.DOTALL)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).split('\n'):
        if ':' in line:
            k, v = line.split(':', 1)
            fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm


def extract_body(text: str) -> str:
    """Remove frontmatter and return body."""
    return re.sub(r'^---\n.*?\n---\n', '', text, count=1, flags=re.DOTALL).strip()


def build_derivative():
    """Build derivative story entries."""
    novels = []
    for lang_dir in ["en", "ko"]:
        lang_path = SHORT_STORIES / lang_dir
        if not lang_path.exists():
            continue
        for md_file in sorted(lang_path.glob("*.md")):
            text = md_file.read_text(encoding="utf-8", errors="replace")
            fm = extract_frontmatter(text)
            body = extract_body(text)
            stem = md_file.stem
            story_id = f"derivative/{lang_dir}/{stem}"
            has_ko = (SHORT_STORIES / "ko" / f"{stem}.md").exists()
            
            # Determine grade from filename prefix or frontmatter
            grade = fm.get("grade", fm.get("quality_grade", "")).upper()
            if not grade:
                # Try to find review json
                review_json = md_file.parent / f"{stem}.review.json"
                if review_json.exists():
                    try:
                        rj = json.loads(review_json.read_text())
                        grade = rj.get("grade", rj.get("quality_grade", "")).upper()
                    except:
                        pass
            if not grade:
                grade = "C"  # default
            
            score = fm.get("score", fm.get("quality_score", "0"))
            try:
                score = int(score)
            except:
                score = 0
            
            word_count = fm.get("word_count", fm.get("wordCount", "0"))
            try:
                word_count = int(word_count)
            except:
                word_count = len(body.split())
            
            year = fm.get("date", fm.get("created", fm.get("year", "2026")))
            if isinstance(year, str) and len(year) >= 4:
                year = year[:4]
            
            title = fm.get("title", stem.replace("_", " ").replace("-", " ").title())
            
            novels.append({
                "id": story_id,
                "title": title,
                "year": year,
                "category": "derivative",
                "hasKo": has_ko if lang_dir == "en" else False,
                "grade": grade,
                "score": score,
                "wordCount": word_count,
                "overview": fm.get("overview", fm.get("description", body[:200] + "..." if len(body) > 200 else body)),
                "content": body,
            })
    
    return novels


def build_originals():
    """Build original wiki work entries."""
    novels = []
    if not WIKI_WORKS.exists():
        return novels
    
    for md_file in sorted(WIKI_WORKS.glob("*.md")):
        if md_file.name.endswith(".ko.md"):
            continue  # Handle KO separately
        text = md_file.read_text(encoding="utf-8", errors="replace")
        fm = extract_frontmatter(text)
        body = extract_body(text)
        stem = md_file.stem
        
        has_ko = (WIKI_WORKS / f"{stem}.ko.md").exists()
        
        # Determine category from filename patterns
        category = "novel"
        if any(x in stem.lower() for x in ["short", "story", "ice-run", "hinterland"]):
            category = "short_story"
        elif any(x in stem.lower() for x in ["essay", "interview", "preface"]):
            category = "essay"
        elif any(x in stem.lower() for x in ["neuromancer", "count-zero", "mona-lisa"]):
            category = "novel"
        
        title = fm.get("title", stem.replace("_", " ").replace("-", " ").title())
        year = fm.get("year", fm.get("date", "1984"))
        if isinstance(year, str) and len(year) >= 4:
            year = year[:4]
        
        # Read KO version if exists
        ko_content = None
        if has_ko:
            ko_file = WIKI_WORKS / f"{stem}.ko.md"
            ko_text = ko_file.read_text(encoding="utf-8", errors="replace")
            ko_content = extract_body(ko_text)
        
        entry = {
            "id": stem,
            "title": title,
            "year": year,
            "category": category,
            "hasKo": has_ko,
            "content": body,
        }
        if ko_content:
            entry["contentKo"] = ko_content
        
        novels.append(entry)
    
    return novels


def main():
    print("Building fiction-data.json...")
    
    originals = build_originals()
    derivatives = build_derivative()
    all_novels = originals + derivatives
    
    # Stats
    stats = {
        "total": len(all_novels),
        "novels": sum(1 for n in all_novels if n["category"] == "novel"),
        "shortStories": sum(1 for n in all_novels if n["category"] == "short_story"),
        "essays": sum(1 for n in all_novels if n["category"] == "essay"),
        "trilogies": sum(1 for n in all_novels if n["category"] == "trilogy"),
        "withKo": sum(1 for n in all_novels if n.get("hasKo")),
        "derivative": sum(1 for n in all_novels if n["category"] == "derivative"),
    }
    
    data = {
        "stats": stats,
        "novels": all_novels,
    }
    
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    
    print(f"Written to {OUTPUT}")
    print(f"Stats: {json.dumps(stats, indent=2)}")
    print(f"File size: {OUTPUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
