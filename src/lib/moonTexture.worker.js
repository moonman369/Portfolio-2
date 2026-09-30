// Decodes the hero moon's texture off the main thread: fetch, decode, read
// the pixels back and keep one channel (see loadMoonTexture in moonSphere.js).
// Replies once with { data, w, h } (the luma buffer is transferred) or
// { error }, and is then terminated by the page.
import { lumaFromRgba } from "./moonSphere";

self.onmessage = async ({ data: { src } }) => {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    const { width: w, height: h } = bitmap;
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const luma = lumaFromRgba(ctx.getImageData(0, 0, w, h).data, w * h);
    self.postMessage({ data: luma, w, h }, [luma.buffer]);
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
