declare module "qrcode" {
  export interface QRCodeRenderOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toDataURL(
    text: string,
    options?: QRCodeRenderOptions,
  ): Promise<string>;
}
