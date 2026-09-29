"""Build the display font used for headings.

Takes the Latin Bricolage Grotesque file from @fontsource-variable (optical
size 12-96, weight 200-800, 77 KB) and pins it to the display cut: optical
size 72, weight 500-700. That keeps the tight, characterful headline design at
every heading size and halves the download (about 38 KB), which matters because
this file is preloaded alongside the JS on slow connections.

Bricolage Grotesque is licensed under the SIL OFL 1.1 with no Reserved Font
Name, so a modified instance may be redistributed; the licence travels with it.

Requires fontTools and brotli (dev only, not an npm dependency):
    pip install fonttools brotli
    python scripts/build-display-font.py
"""

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SOURCE = (
    ROOT
    / "node_modules/@fontsource-variable/bricolage-grotesque/files"
    / "bricolage-grotesque-latin-opsz-normal.woff2"
)
TARGET = ROOT / "src/assets/fonts/bricolage-grotesque-display-latin.woff2"
LICENSE = ROOT / "node_modules/@fontsource-variable/bricolage-grotesque/LICENSE"

OPTICAL_SIZE = 72
WEIGHTS = (500, 700)


def main() -> None:
    font = instancer.instantiateVariableFont(
        TTFont(SOURCE), {"opsz": OPTICAL_SIZE, "wght": WEIGHTS}
    )
    font.flavor = "woff2"
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    font.save(TARGET)
    (TARGET.parent / "LICENSE-bricolage-grotesque.txt").write_text(
        LICENSE.read_text(encoding="utf-8"), encoding="utf-8"
    )
    print(f"{TARGET.relative_to(ROOT)}: {TARGET.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
