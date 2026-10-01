"""Render the moon favicon set from the hero moon's texture.

Same lighting as src/lib/moonSphere.js (Lambert from a sun set by the phase,
soft terminator, limb darkening, blue earthshine on the night side), plus the
thin accent rim of the site mark (MoonMark), so the icon reads on light and
dark browser tabs alike. A waxing gibbous: it keeps its shape at 16px.

Writes to public/:
  favicon-32.png         32px, transparent
  apple-touch-icon.png   180px on the site's dark paper (iOS fills
                         transparency with black and rounds the corners)
  icon-192.png, icon-512.png   transparent

The SVG favicon (public/favicon.svg) is drawn by hand to match.

    python scripts/render-favicons.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TEXTURE = ROOT / "src/assets/moon/moon-1024.webp"
PUBLIC = ROOT / "public"

CYCLE = 0.31  # waxing gibbous, ~83% lit (the hero's old resting phase)
EARTHSHINE = 0.14  # as MoonMark
# Brighter than the hero: at 16-32px the lit side has to carry the shape.
EXPOSURE = 1.45
EDGE_LO, EDGE_SPAN = -0.07, 0.21
RIM = np.array([133, 206, 255], dtype=np.float64)  # dark-mode primary #85ceff
SUPERSAMPLE = 4


def render(size, rim_alpha=0.55, rim_px=None, pad=0.0):
    """RGBA moon on transparency, `size` px, disc inset by `pad` (share)."""
    tex = np.asarray(Image.open(TEXTURE).convert("L"), dtype=np.float64) / 255
    th, tw = tex.shape
    n = size * SUPERSAMPLE
    radius = n / 2 * (1 - 2 * pad) - SUPERSAMPLE * 0.5
    centre = n / 2
    ys, xs = np.mgrid[0:n, 0:n] + 0.5
    px = (xs - centre) / radius
    py = (centre - ys) / radius
    d2 = px * px + py * py
    inside = d2 <= 1
    z = np.sqrt(np.clip(1 - d2, 0, 1))
    lat = np.arcsin(np.clip(py, -1, 1))
    lon = np.arctan2(px, z)
    u = lon / (2 * np.pi) + 0.5
    v = 0.5 - lat / np.pi
    tx = np.clip((u * tw).astype(int), 0, tw - 1)
    ty = np.clip((v * th).astype(int), 0, th - 1)
    albedo = tex[ty, tx]

    angle = np.pi * (1 - 2 * CYCLE)
    lx, lz = np.sin(angle), np.cos(angle)
    ndl = px * lx + z * lz
    t = np.clip((ndl - EDGE_LO) / EDGE_SPAN, 0, 1)
    lit = t * t * (3 - 2 * t)
    shade = (0.8 + 0.2 * z) * albedo
    sun = lit * (0.3 + 0.7 * np.sqrt(np.clip(ndl, 0, 1))) * shade * EXPOSURE
    earth = (1 - lit) * EARTHSHINE * shade
    rgb = np.stack(
        [sun * 255 + earth * 140, sun * 250 + earth * 170, sun * 240 + earth * 255],
        axis=-1,
    )
    rgb = np.clip(rgb, 0, 255)

    # The accent rim: a ring just inside the edge.
    dist = (1 - np.sqrt(d2)) * radius  # px from the edge, inward
    ring_w = (rim_px or max(1.0, size / 32)) * SUPERSAMPLE
    ring = np.clip(1 - np.abs(dist - ring_w / 2) / (ring_w / 2), 0, 1) * rim_alpha
    ring = np.where(inside, ring, 0)[..., None]
    rgb = rgb * (1 - ring) + RIM * ring

    alpha = np.where(inside, 255, 0).astype(np.float64)
    img = Image.fromarray(
        np.dstack([rgb, alpha]).round().astype(np.uint8), "RGBA"
    )
    return img.resize((size, size), Image.LANCZOS)


def palette(img):
    """256 colours: the moon is nearly all greys (512px: 284 KB -> 50 KB)."""
    return img.quantize(
        colors=256,
        method=Image.Quantize.FASTOCTREE if img.mode == "RGBA" else None,
        dither=Image.Dither.FLOYDSTEINBERG,
    )


def main():
    render(32, rim_alpha=0.7).save(PUBLIC / "favicon-32.png", optimize=True)
    palette(render(192)).save(PUBLIC / "icon-192.png", optimize=True)
    palette(render(512)).save(PUBLIC / "icon-512.png", optimize=True)
    # Apple touch icon: an opaque square of dark paper, moon inset.
    touch = Image.new("RGBA", (180, 180), (16, 19, 25, 255))
    moon = render(180, pad=0.1)
    touch.alpha_composite(moon)
    palette(touch.convert("RGB")).save(PUBLIC / "apple-touch-icon.png", optimize=True)
    for name in ["favicon-32.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png"]:
        print(name, (PUBLIC / name).stat().st_size, "bytes")


if __name__ == "__main__":
    main()
