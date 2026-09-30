"""Build the equirectangular texture for the hero's 3D moon.

Source (public domain, credit: NASA's Scientific Visualization Studio):
  https://svs.gsfc.nasa.gov/4720  (CGI Moon Kit)
  lroc_color_poles_4k.tif  colour/albedo, 4096 x 2048
  ldem_16_uint.tif         elevation, 16 px/degree

Output: a 1024 x 512 grayscale map (longitude -180..180, latitude 90..-90):
albedo with a gentle, overhead-lit relief baked in so craters read when the
canvas wraps it on the sphere. The canvas does the real (phase) lighting.
Needs numpy and Pillow (dev only). Run in the folder holding the sources:
    python render-moon-sphere-texture.py sphere.png
then encode to src/assets/moon/ as AVIF + WebP, each under 80 KB.
"""
import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
W, H = 1024, 512


def main(out):
    albedo = Image.open("lroc_color_poles_4k.tif").convert("L").resize((W, H), Image.LANCZOS)
    albedo = np.asarray(albedo, dtype=np.float64) / 255.0

    dem = Image.open("ldem_16_uint.tif").resize((W, H), Image.BILINEAR)
    dem = np.asarray(dem, dtype=np.float64) * 0.5  # half-metre units -> m
    px = 2 * np.pi * 1737400 / W  # metres per pixel at the equator
    lats = np.radians(np.linspace(90, -90, H))[:, None]
    dzdx = np.gradient(dem, axis=1) / (px * np.maximum(np.cos(lats), 0.05))
    dzdy = np.gradient(dem, axis=0) / px
    # Light from high in the north-west: relief without long shadows (the
    # phase lighting on the sphere supplies the terminator).
    lx, ly, lz = -0.35, -0.35, 0.87
    shade = (-dzdx * 3 * lx - dzdy * 3 * ly + lz) / np.sqrt((dzdx * 3) ** 2 + (dzdy * 3) ** 2 + 1)
    shade = np.clip(shade / lz, 0.4, 1.4)

    value = albedo * (0.72 + 0.28 * shade)
    lo, hi = np.percentile(value, 0.5), np.percentile(value, 99.8)
    value = np.clip((value - lo) / (hi - lo), 0, 1)
    value = 0.18 + 0.82 * value
    Image.fromarray((value * 255).astype(np.uint8), "L").save(out)
    print(out, value.shape)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "sphere.png")
