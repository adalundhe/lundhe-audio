"use client";

import { type GearManifestQrPart } from "~/lib/gear-manifests/qr";

const buildPrintDocument = ({
  images,
}: {
  images: string[];
}) => {
  const qrImages = images
    .filter(Boolean)
    .map(
      (image) => `
        <img class="qr" src="${image}" alt="Manifest QR code" />
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Manifest QR Codes</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0.25in;
            background: #fff;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(2.75in, 1fr));
            gap: 0.25in;
            justify-items: center;
            align-items: start;
          }
          .qr {
            width: 100%;
            max-width: 3in;
            display: block;
            aspect-ratio: 1 / 1;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <section class="grid">${qrImages}</section>
      </body>
    </html>
  `;
};

export const printManifestQrCodes = ({
  images,
  parts,
}: {
  images: string[];
  parts: GearManifestQrPart[];
}) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (images.length === 0 || parts.length === 0) {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  const cleanup = () => {
    iframe.onload = null;
    iframe.contentWindow?.removeEventListener("afterprint", cleanup);
    window.setTimeout(() => {
      iframe.remove();
    }, 0);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
    }, 50);
  };

  iframe.srcdoc = buildPrintDocument({
    images,
  });

  document.body.appendChild(iframe);
};
