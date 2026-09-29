// Display-only: responsive AVIF/WebP versions of the project screenshots.
//
// `constants.js` still imports the original PNGs for PROJECTS[].image; those
// stay as the source of truth and the fallback. Each PNG maps to 16:10
// variants in src/assets/projects/ (1x ≈ 640px wide, 2x up to 1280px, never
// upscaled past the source), generated with sharp.

import recogno from "../assets/recogno.png";
import moonmind from "../assets/moonmind.png";
import codesage from "../assets/codesage.png";
import blinkmart from "../assets/blinkmart.png";
import pingbot from "../assets/pingbot.png";
import apixi from "../assets/Capture.PNG";
import yegpt from "../assets/yegpt.png";
import tweetverse from "../assets/tweetverse.png";
import meshnode from "../assets/meshnode.png";
import defund from "../assets/defund2.png";
import selfdrvcar from "../assets/selfdrvcar.png";
import lyriks from "../assets/lyriks.png";

const files = import.meta.glob("../assets/projects/*.{avif,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

// Intrinsic box of every variant: 16:10.
export const PROJECT_IMAGE_WIDTH = 640;
export const PROJECT_IMAGE_HEIGHT = 400;

const variants = (key, format) =>
  Object.entries(files)
    .map(([path, url]) => {
      const match = path.match(new RegExp(`/${key}-(\\d+)\\.${format}$`));
      return match ? { width: Number(match[1]), url } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.width - b.width);

const srcSet = (list) => list.map(({ url, width }) => `${url} ${width}w`).join(", ");

const build = (key) => {
  const avif = variants(key, "avif");
  const webp = variants(key, "webp");
  return {
    avif: srcSet(avif),
    webp: srcSet(webp),
    src: webp[0]?.url,
  };
};

const BY_SOURCE = new Map([
  [recogno, build("recogno")],
  [moonmind, build("moonmind")],
  [codesage, build("codesage")],
  [blinkmart, build("blinkmart")],
  [pingbot, build("pingbot")],
  [apixi, build("apixi")],
  [yegpt, build("yegpt")],
  [tweetverse, build("tweetverse")],
  [meshnode, build("meshnode")],
  [defund, build("defund")],
  [selfdrvcar, build("selfdrvcar")],
  [lyriks, build("lyriks")],
]);

// The responsive set for a project's PNG, or null if there is none.
export const projectMedia = (image) => BY_SOURCE.get(image) ?? null;
