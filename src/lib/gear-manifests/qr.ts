import { z } from "zod";

export const MAX_GEAR_MANIFEST_QR_PAYLOAD_CHARS = 1000;
export const MAX_GEAR_MANIFEST_QR_ENTRIES_PER_PART = 6;

export const gearManifestQrEntrySchema = z.object({
  i: z.string().trim().min(1),
  n: z.string().trim().min(1),
  m: z.string().trim().min(1),
  t: z.string().trim().min(1),
  g: z.string().trim().min(1),
  q: z.number().int().min(0),
});

export const gearManifestQrPartSchema = z.object({
  v: z.literal(1),
  m: z.string().trim().min(1),
  n: z.string().trim().min(1),
  p: z.number().int().min(1),
  c: z.number().int().min(1),
  e: z.array(gearManifestQrEntrySchema).min(1),
});

export type GearManifestQrEntry = z.infer<typeof gearManifestQrEntrySchema>;
export type GearManifestQrPart = z.infer<typeof gearManifestQrPartSchema>;

const normalizeEntry = (entry: GearManifestQrEntry): GearManifestQrEntry => ({
  i: entry.i.trim(),
  n: entry.n.trim(),
  m: entry.m.trim(),
  t: entry.t.trim(),
  g: entry.g.trim(),
  q: Math.max(0, Math.trunc(entry.q)),
});

const serializePart = ({
  manifestId,
  manifestName,
  partIndex,
  partCount,
  entries,
}: {
  manifestId: string;
  manifestName: string;
  partIndex: number;
  partCount: number;
  entries: GearManifestQrEntry[];
}) =>
  JSON.stringify({
    v: 1,
    m: manifestId.trim(),
    n: manifestName.trim(),
    p: partIndex,
    c: partCount,
    e: entries.map(normalizeEntry),
  } satisfies GearManifestQrPart);

export const buildGearManifestQrParts = ({
  manifestId,
  manifestName,
  entries,
}: {
  manifestId: string;
  manifestName: string;
  entries: GearManifestQrEntry[];
}) => {
  const normalizedManifestId = manifestId.trim();
  const normalizedManifestName = manifestName.trim();
  const normalizedEntries = entries.map(normalizeEntry);

  if (!normalizedManifestId || !normalizedManifestName || normalizedEntries.length === 0) {
    return [] as GearManifestQrPart[];
  }

  const chunks: GearManifestQrEntry[][] = [];
  let currentChunk: GearManifestQrEntry[] = [];

  for (const entry of normalizedEntries) {
    const tentativeChunk = [...currentChunk, entry];
    const tentativeSerialized = serializePart({
      manifestId: normalizedManifestId,
      manifestName: normalizedManifestName,
      partIndex: 1,
      partCount: 99,
      entries: tentativeChunk,
    });

    if (
      currentChunk.length > 0 &&
      (tentativeChunk.length > MAX_GEAR_MANIFEST_QR_ENTRIES_PER_PART ||
        tentativeSerialized.length > MAX_GEAR_MANIFEST_QR_PAYLOAD_CHARS)
    ) {
      chunks.push(currentChunk);
      currentChunk = [entry];
      continue;
    }

    currentChunk = tentativeChunk;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const partCount = Math.max(chunks.length, 1);

  return chunks.map(
    (chunk, index) =>
      ({
        v: 1,
        m: normalizedManifestId,
        n: normalizedManifestName,
        p: index + 1,
        c: partCount,
        e: chunk,
      }) satisfies GearManifestQrPart,
  );
};

export const serializeGearManifestQrPart = (part: GearManifestQrPart) =>
  serializePart({
    manifestId: part.m,
    manifestName: part.n,
    partIndex: part.p,
    partCount: part.c,
    entries: part.e,
  });

export const parseGearManifestQrPart = (value: string) => {
  try {
    return gearManifestQrPartSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
};

export const getGearManifestQrPartKey = (part: Pick<GearManifestQrPart, "m" | "p">) =>
  `${part.m}:${part.p}`;

export const combineGearManifestQrParts = (parts: GearManifestQrPart[]) => {
  if (parts.length === 0) {
    return {
      manifestId: "",
      manifestName: "",
      partCount: 0,
      scannedPartCount: 0,
      missingPartIndexes: [] as number[],
      isComplete: false,
      entries: [] as GearManifestQrEntry[],
    };
  }

  const sortedParts = [...parts].sort((left, right) => left.p - right.p);
  const [firstPart] = sortedParts;
  const partCount = firstPart?.c ?? 0;
  const manifestId = firstPart?.m ?? "";
  const manifestName = firstPart?.n ?? "";
  const uniqueParts = new Map<number, GearManifestQrPart>();

  for (const part of sortedParts) {
    if (part.m !== manifestId || part.c !== partCount) {
      continue;
    }

    uniqueParts.set(part.p, part);
  }

  const missingPartIndexes = Array.from({ length: partCount }, (_, index) => index + 1)
    .filter((partIndex) => !uniqueParts.has(partIndex));

  return {
    manifestId,
    manifestName,
    partCount,
    scannedPartCount: uniqueParts.size,
    missingPartIndexes,
    isComplete: missingPartIndexes.length === 0 && uniqueParts.size > 0,
    entries: [...uniqueParts.entries()]
      .sort((left, right) => left[0] - right[0])
      .flatMap(([, part]) => part.e),
  };
};
