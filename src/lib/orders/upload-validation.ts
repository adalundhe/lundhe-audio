import type { ParsedAudioMetadata } from "~/lib/audio/wav-metadata";
import type { OrderSongSpec } from "~/types/orders";

export const isAcceptedSourceFileName = (fileName: string) => {
  const lowerCaseName = fileName.toLowerCase();
  return (
    lowerCaseName.endsWith(".wav") || lowerCaseName.endsWith(".wave")
  );
};

export const getNormalizedUploadKey = ({
  fileName,
  relativePath,
}: {
  fileName: string;
  relativePath: string | null;
}) => relativePath?.trim() || fileName;

export const validateSongFileMetadata = ({
  metadata,
  songSpec,
}: {
  metadata: ParsedAudioMetadata;
  songSpec: OrderSongSpec;
}) => {
  const validationMessages: string[] = [];

  if (!songSpec.allowedBitDepths.includes(metadata.bitDepth)) {
    validationMessages.push(
      `Expected ${songSpec.allowedBitDepths.join(", ")}-bit audio, received ${metadata.bitDepth}-bit.`,
    );
  }

  if (!songSpec.allowedSampleRates.includes(metadata.sampleRateHz)) {
    validationMessages.push(
      `Expected ${songSpec.allowedSampleRates
        .map((rate) => `${rate / 1000} kHz`)
        .join(" or ")}, received ${(metadata.sampleRateHz / 1000).toFixed(1)} kHz.`,
    );
  }

  if (songSpec.expectedDurationSeconds !== null) {
    const durationDelta = Math.abs(
      metadata.durationSeconds - songSpec.expectedDurationSeconds,
    );

    if (durationDelta > songSpec.durationToleranceSeconds) {
      validationMessages.push(
        `Expected roughly ${songSpec.expectedDurationSeconds} sec (+/- ${songSpec.durationToleranceSeconds} sec), received ${metadata.durationSeconds.toFixed(2)} sec.`,
      );
    }
  }

  return validationMessages;
};
