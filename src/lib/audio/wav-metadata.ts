export interface ParsedAudioMetadata {
  channelCount: number;
  sampleRateHz: number;
  bitDepth: number;
  durationSeconds: number;
}

const WAV_HEADER_MIN_BYTES = 44;

const toUint8Array = (value: ArrayBuffer | Uint8Array) =>
  value instanceof Uint8Array ? value : new Uint8Array(value);

const readAscii = (
  bytes: Uint8Array,
  start: number,
  end: number,
) => String.fromCharCode(...bytes.slice(start, end));

const toEvenChunkSize = (size: number) => size + (size % 2);

const parseWaveMetadata = (
  input: ArrayBuffer | Uint8Array,
): ParsedAudioMetadata => {
  const bytes = toUint8Array(input);

  if (bytes.length < WAV_HEADER_MIN_BYTES) {
    throw new Error("WAV file is too small to contain a valid header.");
  }

  if (
    readAscii(bytes, 0, 4) !== "RIFF" ||
    readAscii(bytes, 8, 12) !== "WAVE"
  ) {
    throw new Error("Unsupported WAV header.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let cursor = 12;
  let sampleRateHz: number | null = null;
  let bitDepth: number | null = null;
  let channelCount: number | null = null;
  let blockAlign: number | null = null;
  let dataSize: number | null = null;

  while (cursor + 8 <= bytes.length) {
    const chunkId = readAscii(bytes, cursor, cursor + 4);
    const chunkSize = view.getUint32(cursor + 4, true);
    const chunkStart = cursor + 8;

    if (chunkId === "fmt " && chunkStart + 16 <= bytes.length) {
      channelCount = view.getUint16(chunkStart + 2, true);
      sampleRateHz = view.getUint32(chunkStart + 4, true);
      blockAlign = view.getUint16(chunkStart + 12, true);
      bitDepth = view.getUint16(chunkStart + 14, true);
    }

    if (chunkId === "data") {
      dataSize = chunkSize;
    }

    cursor = chunkStart + toEvenChunkSize(chunkSize);
  }

  if (
    sampleRateHz === null ||
    bitDepth === null ||
    channelCount === null ||
    blockAlign === null ||
    dataSize === null
  ) {
    throw new Error("Could not read WAV audio metadata.");
  }

  return {
    channelCount,
    sampleRateHz,
    bitDepth,
    durationSeconds: dataSize / blockAlign / sampleRateHz,
  };
};

export const parseAudioMetadata = (
  fileName: string,
  input: ArrayBuffer | Uint8Array,
): ParsedAudioMetadata => {
  const lowerCaseName = fileName.toLowerCase();

  if (lowerCaseName.endsWith(".wav") || lowerCaseName.endsWith(".wave")) {
    return parseWaveMetadata(input);
  }

  throw new Error("Unsupported source format. Upload WAV/WAVE files only.");
};
