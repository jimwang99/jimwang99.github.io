"""Import the Obsidian Publish archive into Hugo topic sections."""

import argparse
import difflib
import hashlib
import html
import json
import re
import shutil
import unicodedata
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote, unquote


WIKI = re.compile(r"(!?)\[\[([^]]+)\]\]")
IMAGE = re.compile(r"!\[([^]]*)\]\(([^)]+)\)")
LINK = re.compile(r"(?<!!)\[([^]]+)\]\(([^)]+)\)")
DATE = re.compile(r"^(\d{4}-\d{2}-\d{2})\s+(.+)$")
LEADING_EMOJI = re.compile(
    r"^[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200D\U0001F3FB-\U0001F3FF]+\s*"
)
FENCE = re.compile(r"^\s*(`{3,}|~{3,})")
MEDIA_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf"}
EXCLUDED_TITLES = {"中国科技公司见闻一例", "Give notice to OURS"}
TRAINING_PREFIX = "[RISC-V Architecture Training] "
TOPIC_OVERRIDES = {
    "ARM Training Cortex Processor Behaviors": "architecture",
    "Chisel3 Systolic Array Generator": "chip-design",
    "[Cousera Note] Machine Learning Foundations A Case Study Approach": "machine-learning",
    "Course Note of Python Design Patterns": "tools",
    "FPGA Solution for LiDAR Project": "chip-design",
    "GENUS Training Notes": "chip-design",
    "INNOVUS Training Notes": "chip-design",
    "Scala First Look": "tools",
    "SystemC Tutorial": "chip-design",
    "SystemVerilog for Design Note": "chip-design",
}
TRAINING_LINKS = {
    "lecture-00-schedule/index.html": "2019-11-27 [RISC-V Architecture Training] Schedule",
    "lecture-10-intro/index.html": "2019-11-27 [RISC-V Architecture Training] Introduction of RISC-V Open ISA",
    "lecture-20-isa-basic/index.html": "2019-11-27 [RISC-V Architecture Training] Basics & Unprivileged Specification",
    "lecture-30-isa-privileged/index.html": "2019-11-27 [RISC-V Architecture Training] Privileged Architecture",
    "lecture-40-cpu-arch/index.html": "2019-11-27 [RISC-V Architecture Training] Computer Architecture with RISC-V Examples",
    "lecture-50-uncore/index.html": "2019-11-27 [RISC-V Architecture Training] Uncore",
}


def slugify(value):
    value = unicodedata.normalize("NFKC", value).lower()
    return re.sub(r"[^\w]+", "-", value, flags=re.UNICODE).strip("-_").replace("_", "-")


def split_name(path):
    match = DATE.match(path.stem)
    return (match.group(1), match.group(2)) if match else (None, path.stem)


def media_inventory(roots):
    inventory = defaultdict(list)
    for root in roots:
        for path in root.rglob("*"):
            if path.is_file() and ".git" not in path.parts:
                inventory[path.name.casefold()].append(path)
    return inventory


def choose_media(name, inventory):
    matches = inventory.get(name.casefold(), [])
    if not matches:
        return None
    matches.sort(key=lambda path: ("/blog/" not in str(path), len(str(path))))
    if name == "riscv-rv32i-load-store-instruction.png":
        return next(path for path in matches if "/blog/arch/" in str(path))
    checksums = {hashlib.sha256(path.read_bytes()).hexdigest() for path in matches}
    if len(checksums) > 1:
        raise ValueError(f"Different media files share the name {name}: {matches}")
    return matches[0]


def front_matter(title, date=None, aliases=()):
    title = LEADING_EMOJI.sub("", title)
    lines = ["---", f"title: {json.dumps(title, ensure_ascii=False)}"]
    if date:
        lines.append(f"date: {date}")
    if aliases:
        lines.append("aliases:")
        lines.extend(f"  - {json.dumps(alias, ensure_ascii=False)}" for alias in sorted(aliases))
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def old_url_aliases(old_site, files):
    if old_site is None:
        return {}, []
    aliases = defaultdict(list)
    unmatched = []
    details = {path: split_name(path) for path in files}

    def comparable(value):
        value = unicodedata.normalize("NFKC", value).casefold()
        return re.sub(r"[^\w]+", "", value)

    for page in sorted((old_site / "blog").rglob("index.html")):
        relative = page.relative_to(old_site)
        if len(relative.parts) < 4 or "page" in relative.parts:
            continue
        match = re.search(r"<title>(.*?)</title>", page.read_text(errors="ignore"), re.I | re.S)
        old_title = html.unescape(match.group(1)).split(" - When Moore")[0].strip() if match else ""
        old_date = re.search(r"\d{4}-\d{2}-\d{2}", str(relative))
        pool = [path for path in files if details[path][0] == old_date.group()] if old_date else files
        if "riscv-architecture-training" in str(relative):
            pool = [path for path in files if "[RISC-V Architecture Training]" in details[path][1]]
        if not pool:
            pool = files
        ranked = sorted(
            ((difflib.SequenceMatcher(None, comparable(old_title), comparable(details[path][1])).ratio(), path)
             for path in pool),
            reverse=True,
        )
        score, best = ranked[0]
        runner_up = ranked[1][0] if len(ranked) > 1 else 0
        if (score >= 0.77 and score - runner_up >= 0.08) or (not old_title and len(pool) == 1):
            aliases[best].append("/" + str(relative.parent) + "/")
        else:
            unmatched.append(str(relative))
    return aliases, unmatched


def import_blog(source, destination, media_roots, old_site=None):
    files = sorted(
        path
        for path in source.rglob("*.md")
        if path.parent != source and split_name(path)[1] not in EXCLUDED_TITLES
    )
    aliases, unmatched_old_urls = old_url_aliases(old_site, files)
    site_map = {}
    output_map = {}
    for path in files:
        date, title = split_name(path)
        topic = TOPIC_OVERRIDES.get(
            LEADING_EMOJI.sub("", title), slugify(path.parent.name)
        )
        if topic == "architecture" and title.startswith(TRAINING_PREFIX):
            topic += "/risc-v-architecture-training"
            slug = slugify(title.removeprefix(TRAINING_PREFIX))
        else:
            slug = slugify(title)
        if not slug:
            raise ValueError(f"No usable slug: {path}")
        output = destination / "content" / "posts" / topic / f"{slug}.md"
        if output in output_map.values():
            raise ValueError(f"Duplicate destination: {output}")
        output_map[path] = output
        site_map[path.stem] = f"/posts/{topic}/{slug}/"

    inventory = media_inventory(media_roots)
    media_output = destination / "static" / "legacy-media"
    missing_media = set()
    unresolved_links = set()

    def media_url(source_page, raw):
        name = Path(unquote(raw.split("|")[0])).name
        candidate = source_page.parent / raw
        if not candidate.is_file():
            candidate = source / "assets" / name
        if not candidate.is_file():
            candidate = choose_media(name, inventory)
        if candidate is None:
            missing_media.add((str(source_page.relative_to(source)), raw))
            return None
        target = media_output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and target.read_bytes() != candidate.read_bytes():
            raise ValueError(f"Conflicting media output: {name}")
        if not target.exists():
            shutil.copy2(candidate, target)
        return "/legacy-media/" + quote(name)

    for source_page, output in output_map.items():
        date, title = split_name(source_page)
        page_aliases = list(aliases[source_page])
        old_topic = slugify(source_page.parent.name)
        new_topic = output.relative_to(destination / "content" / "posts").parts[0]
        if old_topic != new_topic:
            page_aliases.append(f"/posts/{old_topic}/{slugify(title)}/")
        if title.startswith(TRAINING_PREFIX):
            page_aliases.append(f"/posts/architecture/{slugify(title)}/")
            title = title.removeprefix(TRAINING_PREFIX)
        text = source_page.read_text(encoding="utf-8")
        converted = []
        fence_marker = None
        for line in text.splitlines(keepends=True):
            fence = FENCE.match(line)
            if fence:
                marker = fence.group(1)
                if fence_marker is None:
                    fence_marker = marker
                elif marker[0] == fence_marker[0] and len(marker) >= len(fence_marker):
                    fence_marker = None
                converted.append(line)
                continue
            if fence_marker:
                converted.append(line)
                continue
            line = line.replace("<br>", "; ")
            for old_link, target in TRAINING_LINKS.items():
                line = line.replace(f"]({old_link})", f"]({site_map[target]})")

            def replace_wiki(match):
                embed, raw = match.groups()
                target, _, size = raw.partition("|")
                if embed:
                    url = media_url(source_page, target)
                    if url is None:
                        return "*Screen recording not found in the available backups.*"
                    if size.isdigit():
                        return '{{< figure src="' + url + '" width="' + size + '" >}}'
                    return f"![{Path(target).stem}]({url})"
                url = site_map.get(target)
                if url is None:
                    unresolved_links.add((str(source_page.relative_to(source)), target))
                    return match.group(0)
                return f"[{target}]({url})"

            line = WIKI.sub(replace_wiki, line)

            def replace_image(match):
                alt, raw = match.groups()
                if raw.startswith(("http://", "https://", "data:")):
                    return match.group(0)
                if "data:image/" in raw:
                    return ""  # A one-pixel image embedded in the old export.
                url = media_url(source_page, raw)
                if url:
                    return f"![{alt}]({url})"
                return "*[Example image not included in the archive]*"

            line = IMAGE.sub(replace_image, line)

            def replace_link(match):
                label, raw = match.groups()
                if raw.startswith(("http://", "https://", "mailto:", "#")):
                    return match.group(0)
                if raw.endswith(".md"):
                    target = Path(raw).stem
                    url = site_map.get(target)
                    if url:
                        return f"[{label}]({url})"
                    unresolved_links.add((str(source_page.relative_to(source)), raw))
                    return label
                if Path(raw).suffix.lower() in MEDIA_SUFFIXES:
                    url = media_url(source_page, raw)
                    return f"[{label}]({url})" if url else label
                return match.group(0)

            line = LINK.sub(replace_link, line)
            line = re.sub(r"\[title: “([^”]+)”\]\(([^)]+)\)", r"[\1](\2)", line)
            for wrapper in (".center[", ".footnote["):
                if line.strip().startswith(wrapper) and line.rstrip().endswith("]"):
                    line = line.replace(wrapper, "", 1)
                    last_bracket = line.rfind("]")
                    line = line[:last_bracket] + line[last_bracket + 1 :]
            if line.strip() == ".row[":
                continue
            line = re.sub(r"!\((.*)\)\[(https?://[^]]+)\]", r"[\1](\2)", line)
            converted.append(line)

        output.parent.mkdir(parents=True, exist_ok=True)
        body = "\n".join(line.rstrip() for line in "".join(converted).splitlines()).rstrip() + "\n"
        output.write_text(front_matter(title, date, page_aliases) + body, encoding="utf-8")

    topics = {
        path.relative_to(destination / "content" / "posts").parts[0]
        for path in output_map.values()
    }
    for weight, topic in enumerate(sorted(topics), start=1):
        output = destination / "content" / "posts" / topic / "_index.md"
        title = topic.replace("-", " ").title()
        output.write_text(
            front_matter(title)
            .replace("---\n\n", f"weight: {weight}\nbookCollapseSection: true\n---\n\n", 1)
            + f"Browse the {title} posts.\n",
            encoding="utf-8",
        )

    training_section = (
        destination
        / "content"
        / "posts"
        / "architecture"
        / "risc-v-architecture-training"
        / "_index.md"
    )
    training_section.write_text(
        '---\ntitle: "RISC-V Architecture Training"\nweight: 1\nbookCollapseSection: true\n---\n\nBrowse the RISC-V Architecture Training posts.\n',
        encoding="utf-8",
    )

    return len(files), missing_media, unresolved_links, unmatched_old_urls, sum(map(len, aliases.values()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--old-site", type=Path)
    parser.add_argument("media_roots", nargs="*", type=Path)
    args = parser.parse_args()
    count, missing, unresolved, unmatched, alias_count = import_blog(
        args.source, args.destination, args.media_roots, args.old_site
    )
    print(f"Imported {count} pages")
    print(f"Preserved {alias_count} old URLs")
    print(f"Unmatched old URLs: {unmatched}")
    print(f"Missing media: {sorted(missing)}")
    print(f"Unresolved links: {sorted(unresolved)}")


if __name__ == "__main__":
    main()
