"""Download selected Wikimedia Commons diagrams with license and source metadata.

Run: python scripts/download-visuals.py
Only CC0/public-domain and CC BY/CC BY-SA files under 2 MB are accepted.
"""
import html
import json
import pathlib
import re
import time
import requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "visuals"
OUT.mkdir(parents=True, exist_ok=True)
TITLES = [
    "DilationErosion.png", "MorphologicalDilation.png", "Histogram_equalization.png",
    "Binary image dilation.png", "Binary image erosion.png", "Binary image with holes.png",
    "Binary tree.svg", "Binary tree structure.svg", "Binary search tree.svg",
    "OSI Model v1.svg", "Generalization (UML class diagram).svg",
    "Adapter using inheritance UML class diagram.svg", "Quicksort-example.gif",
    "Merge-sort-example-300px.gif", "Linked list.svg", "RGB color model.svg",
    "HSV color solid cylinder.png", "Database normalization.svg", "Venn diagram gr la rbg.svg"
]
session = requests.Session()
session.headers["User-Agent"] = "CSInterviewCoachPro/1.0 (educational visual assets; contact via repository)"
manifest_path = OUT / "manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else []

for title in TITLES:
    response = session.get("https://commons.wikimedia.org/w/api.php", params={
        "action": "query", "titles": "File:" + title, "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata", "format": "json"
    }, timeout=25)
    response.raise_for_status()
    page = next(iter(response.json()["query"]["pages"].values()))
    info = page.get("imageinfo", [{}])[0]
    license_name = html.unescape(re.sub("<[^>]+>", "", info.get("extmetadata", {}).get("LicenseShortName", {}).get("value", ""))).strip()
    mime = info.get("mime", "")
    if not info.get("url") or mime not in {"image/png", "image/svg+xml", "image/gif"} or info.get("size", 0) > 2_000_000:
        print("SKIP missing/large/unsupported:", title)
        continue
    if not (license_name in {"CC0", "Public domain"} or re.fullmatch(r"CC BY(?:-SA)? [1-4]\.0", license_name)):
        print("SKIP license:", title, license_name)
        continue
    suffix = {"image/png": ".png", "image/svg+xml": ".svg", "image/gif": ".gif"}[mime]
    name = re.sub("[^a-z0-9]+", "-", title.rsplit(".", 1)[0].lower()).strip("-") + suffix
    if (OUT / name).exists():
        print("EXISTS:", name)
    else:
        for attempt in range(3):
            data = session.get(info["url"].split("?", 1)[0], timeout=35)
            if data.status_code != 429: break
            time.sleep(8 * (attempt + 1))
        if not data.ok:
            print("SKIP download error:", title, data.status_code)
            continue
        (OUT / name).write_bytes(data.content)
    metadata = info.get("extmetadata", {})
    author = html.unescape(re.sub("<[^>]+>", "", metadata.get("Artist", {}).get("value", "Unknown"))).strip()
    manifest = [entry for entry in manifest if entry["path"] != "assets/visuals/" + name]
    manifest.append({"title": page["title"], "path": "assets/visuals/" + name,
        "source": info["descriptionurl"], "license": license_name, "author": author})
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("DOWNLOADED:", name, license_name)
    time.sleep(1)

print(f"Saved {len(manifest)} visual assets")
