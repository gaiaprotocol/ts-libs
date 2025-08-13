import { Resvg } from '@cf-wasm/resvg';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function combinePngs(
  width: number,
  height: number,
  pngBuffers: ArrayBuffer[],
  textOptions?: {
    fontBytes: Uint8Array;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    color: string;
  },
): Uint8Array<ArrayBufferLike> {
  let svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  pngBuffers.forEach((buffer) => {
    const base64String = arrayBufferToBase64(buffer);
    svg +=
      `<image href="data:image/png;base64,${base64String}" x="0" y="0" width="${width}" height="${height}" />`;
  });

  if (textOptions) {
    const { fontBytes, x, y, text } = textOptions;
    svg += `<style>
@font-face {
  font-family: "customFont";
  src: url('data:font/woff2;base64,${btoa(String.fromCharCode(...fontBytes))
      }') format("woff2");
}
text { font-family:"customFont"; font-size:${textOptions.fontSize}px; fill:${textOptions.color}; }
</style>`;
    svg +=
      `<text x="${x}" y="${y}" dominant-baseline="central" text-anchor="middle">${text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .trim()
      }</text>`;
  }

  svg += '</svg>';
  const resvg = new Resvg(
    svg,
    !textOptions ? { fitTo: { mode: 'width', value: width } } : {
      fitTo: { mode: 'width', value: width },
      font: {
        fontBuffers: [textOptions.fontBytes],
        defaultFontFamily: 'customFont',
        loadSystemFonts: false,
      },
    },
  );
  return resvg.render().asPng();
}