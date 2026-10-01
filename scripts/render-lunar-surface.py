"""Render a sunlit lunar-surface texture from NASA's CGI Moon Kit.

Source (public domain, credit: NASA's Scientific Visualization Studio):
  https://svs.gsfc.nasa.gov/4720
  ldem_16_uint.tif        elevation, 16 px/degree
  lroc_color_poles_4k.tif colour (albedo), 11.4 px/degree

A region is cropped from the equirectangular maps near the equator (little
stretch), shaded with a low sun for crisp crater relief, modulated by the real
albedo, and tinted cool grey. Needs numpy and Pillow (dev only).

Usage: download the two files above into a working folder, run there:
    python render-lunar-surface.py surface.png
then encode surface.png to src/assets/lunar/ (1600px landscape and a 900px
portrait crop, AVIF + WebP, each under 120 KB; median(3) before encoding
keeps the sizes down).
"""
import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

LON0, LON1 = -38.0, 62.0  # 100 degrees wide
LAT0, LAT1 = 30.0, -32.5  # 62.5 degrees tall -> 1600 x 1000 at 16 px/deg
SUN_AZIMUTH = 255.0  # degrees, light from the west-south-west
SUN_ELEVATION = 22.0  # degrees above the horizon: long shadows
EXAGGERATION = 2.4


def crop(img, ppd, width):
    x0 = int((LON0 + 180) * ppd)
    x1 = int((LON1 + 180) * ppd)
    y0 = int((90 - LAT0) * ppd)
    y1 = int((90 - LAT1) * ppd)
    return img.crop((x0, y0, x1, y1))


def main(out):
    dem_img = crop(Image.open("ldem_16_uint.tif"), 16, 5760)
    dem = np.asarray(dem_img, dtype=np.float64) * 0.5  # half-metre units -> m
    h, w = dem.shape

    # Pixel size in metres (1/16 degree on a 1737.4 km sphere), with the
    # east-west spacing shrinking with latitude.
    px = 2 * np.pi * 1737400 / (360 * 16)
    lats = np.radians(np.linspace(LAT0, LAT1, h))[:, None]
    dzdx = np.gradient(dem, axis=1) / (px * np.cos(lats))
    dzdy = np.gradient(dem, axis=0) / px
    dzdx *= EXAGGERATION
    dzdy *= EXAGGERATION

    az = np.radians(SUN_AZIMUTH)
    el = np.radians(SUN_ELEVATION)
    lx, ly, lz = np.cos(el) * np.sin(az), -np.cos(el) * np.cos(az), np.sin(el)
    norm = np.sqrt(dzdx ** 2 + dzdy ** 2 + 1)
    shade = (-dzdx * lx - dzdy * ly + lz) / norm
    shade = np.clip(shade / np.sin(el), 0, 1.6)  # flat ground ~ 1

    albedo_img = crop(Image.open("lroc_color_poles_4k.tif"), 4096 / 360, 4096)
    albedo = np.asarray(
        albedo_img.convert("L").resize((w, h), Image.BICUBIC), dtype=np.float64
    ) / 255.0
    albedo = (albedo - albedo.min()) / (albedo.max() - albedo.min())

    value = shade * (0.55 + 0.45 * albedo)
    # Tone: keep shadows crisp but not black; highlights near white.
    lo, hi = np.percentile(value, 0.5), np.percentile(value, 99.7)
    value = np.clip((value - lo) / (hi - lo), 0, 1)
    value = 0.12 + 0.88 * value ** 0.9

    tint = np.array([0.93, 0.955, 1.0])  # cool grey stone
    rgb = np.clip(value[..., None] * tint * 255, 0, 255).astype(np.uint8)
    Image.fromarray(rgb).save(out)
    print(out, rgb.shape)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "surface.png")
