"""Generate content-hash asset version for cache busting. Run after CSS/JS changes."""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
ASSET_FILES = [
    "css/style.css",
    "js/icons.js",
    "js/storage.js",
    "js/game.js",
    "js/app.js",
    "index.html",
]

digest = hashlib.sha256()
file_hashes = {}
for rel in ASSET_FILES:
    path = ROOT / rel
    data = path.read_bytes()
    file_hashes[rel] = hashlib.sha256(data).hexdigest()[:8]
    digest.update(data)

version = digest.hexdigest()[:12]
payload = {"v": version, "files": file_hashes}
(ROOT / "data" / "version.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")

index_path = ROOT / "index.html"
html = index_path.read_text(encoding="utf-8")
html = re.sub(
    r'<meta name="asset-version" content="[^"]*" />',
    f'<meta name="asset-version" content="{version}" />',
    html,
)
index_path.write_text(html, encoding="utf-8")
print(f"Asset version: {version}")
print(f"Wrote data/version.json")