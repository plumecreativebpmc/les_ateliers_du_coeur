"""
download_fonts_fixed.py — Téléchargement robuste des polices WOFF2
- Marcellus (400)
- Work Sans (400 / 500 / 600)

Prérequis :  python -m pip install requests
Usage     :  python download_fonts_fixed.py
"""

from pathlib import Path
import re
import sys

try:
    import requests
except ImportError:
    print("❌ Le module 'requests' n'est pas installé. Lancez: python -m pip install requests")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent
DEST = ROOT / "assets" / "fonts"
DEST.mkdir(parents=True, exist_ok=True)

UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
}

CSS_URLS = {
    "Marcellus": "https://fonts.googleapis.com/css2?family=Marcellus&display=swap",
    "Work Sans": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&display=swap",
}

TARGETS = {
    "Marcellus": {400: "Marcellus-Regular.woff2"},
    "Work Sans": {400: "WorkSans-Regular.woff2", 500: "WorkSans-Medium.woff2", 600: "WorkSans-SemiBold.woff2"},
}

def fetch_css(url: str) -> str:
    r = requests.get(url, headers=UA, timeout=30)
    r.raise_for_status()
    return r.text

def parse_blocks(css: str):
    """
    Retourne une liste de tuples (weight:int, url:str) pour chaque bloc @font-face normal.
    """
    blocks = re.findall(r"@font-face\s*{(.*?)}", css, flags=re.I | re.S)
    results = []
    for b in blocks:
        # on ne garde que font-style: normal
        if not re.search(r"font-style\s*:\s*normal", b, flags=re.I):
            continue
        m_w = re.search(r"font-weight\s*:\s*(\d+)", b, flags=re.I)
        m_u = re.search(r"url\((https:[^)]+?\.woff2)\)", b, flags=re.I)
        if m_w and m_u:
            results.append((int(m_w.group(1)), m_u.group(1)))
    return results

def download(url: str, dest: Path):
    with requests.get(url, headers=UA, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                if chunk:
                    f.write(chunk)

def main():
    print(f"📁 Dossier de destination : {DEST}")
    for family, css_url in CSS_URLS.items():
        print(f"\n⇢ Récupération CSS pour {family} …")
        css = fetch_css(css_url)
        pairs = parse_blocks(css)
        if not pairs:
            print("  ⚠️ Aucun bloc @font-face trouvé. CSS ci-dessous pour debug :\n", css[:4000])
            sys.exit(1)
        by_weight = {w:u for (w,u) in pairs}
        for weight, out_name in TARGETS[family].items():
            url = by_weight.get(weight)
            if not url:
                # fallback : prendre le premier .woff2 dispo
                url = pairs[0][1]
                print(f"  ⚠️ Poids {weight} non trouvé, fallback sur : {url}")
            print(f"  ⬇️  {family} {weight} → {out_name}")
            download(url, DEST / out_name)
            print(f"  ✅  Enregistré : {DEST / out_name}")
    print("\n🎉 Terminé. Fichiers attendus :")
    for fam in TARGETS.values():
        for out_name in fam.values():
            print("   -", out_name)

if __name__ == "__main__":
    main()
