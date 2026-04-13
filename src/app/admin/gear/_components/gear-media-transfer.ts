"use client";

const MAX_TRANSFER_ATTEMPTS = 3;
const MULTIPART_TRANSFER_CONCURRENCY = 4;
const MEBIBYTE = 1024 * 1024;

const sleep = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const getTransferPartSizeBytes = (byteSize: number) => {
  if (byteSize >= 1024 * MEBIBYTE) {
    return 64 * MEBIBYTE;
  }

  if (byteSize >= 256 * MEBIBYTE) {
    return 32 * MEBIBYTE;
  }

  return 16 * MEBIBYTE;
};

export const uploadMultipartFileToPresignedUrls = async ({
  file,
  instruction,
  onProgress,
  onRetry,
}: {
  file: File;
  instruction: {
    contentType: string;
    partSizeBytes: number;
    parts: Array<{ partNumber: number; url: string }>;
  };
  onProgress: (loadedBytes: number) => void;
  onRetry?: (attempt: number) => void;
}) => {
  const uploadedBytesByPart = new Array(instruction.parts.length).fill(0);
  const completedParts: Array<{ eTag: string; partNumber: number }> = [];
  const pendingParts = [...instruction.parts];

  const uploadPart = async ({
    partNumber,
    url,
  }: {
    partNumber: number;
    url: string;
  }) => {
    const start = (partNumber - 1) * instruction.partSizeBytes;
    const end = Math.min(start + instruction.partSizeBytes, file.size);
    const blob = file.slice(start, end);
    let attempt = 0;

    while (attempt < MAX_TRANSFER_ATTEMPTS) {
      try {
        const eTag = await new Promise<string>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("PUT", url);
          request.setRequestHeader("Content-Type", instruction.contentType);

          request.upload.onprogress = (event) => {
            if (!event.lengthComputable) {
              return;
            }

            uploadedBytesByPart[partNumber - 1] = event.loaded;
            onProgress(
              uploadedBytesByPart.reduce(
                (total, currentValue) => total + currentValue,
                0,
              ),
            );
          };

          request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
              uploadedBytesByPart[partNumber - 1] = blob.size;
              onProgress(
                uploadedBytesByPart.reduce(
                  (total, currentValue) => total + currentValue,
                  0,
                ),
              );
              resolve(
                request.getResponseHeader("ETag")?.replaceAll('"', "") ?? "",
              );
              return;
            }

            reject(
              new Error(
                `Part ${partNumber} failed with status ${request.status}.`,
              ),
            );
          };

          request.onerror = () => {
            reject(new Error(`Part ${partNumber} failed before completion.`));
          };

          request.send(blob);
        });

        completedParts.push({
          eTag,
          partNumber,
        });
        return;
      } catch (error) {
        attempt += 1;
        uploadedBytesByPart[partNumber - 1] = 0;
        onRetry?.(attempt);

        if (attempt >= MAX_TRANSFER_ATTEMPTS) {
          throw error;
        }

        await sleep(500 * 2 ** (attempt - 1) + Math.round(Math.random() * 300));
      }
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          MULTIPART_TRANSFER_CONCURRENCY,
          pendingParts.length,
        ),
      },
      async () => {
        while (pendingParts.length > 0) {
          const nextPart = pendingParts.shift();

          if (!nextPart) {
            return;
          }

          await uploadPart(nextPart);
        }
      },
    ),
  );

  return completedParts.sort((left, right) => left.partNumber - right.partNumber);
};

export const downloadMultipartFileFromRoute = async ({
  byteSize,
  contentType,
  fileName,
  onProgress,
  url,
}: {
  byteSize: number;
  contentType: string;
  fileName: string;
  onProgress?: (loadedBytes: number) => void;
  url: string;
}) => {
  const partSizeBytes = getTransferPartSizeBytes(byteSize);
  const partCount = Math.max(1, Math.ceil(byteSize / partSizeBytes));
  const downloadedBytesByPart = new Array(partCount).fill(0);
  const parts = Array.from({ length: partCount }, (_, index) => ({
    end: Math.min(((index + 1) * partSizeBytes) - 1, byteSize - 1),
    partNumber: index + 1,
    start: index * partSizeBytes,
  }));
  const results = new Array<ArrayBuffer | null>(partCount).fill(null);
  const pendingParts = [...parts];

  const downloadPart = async ({
    end,
    partNumber,
    start,
  }: {
    end: number;
    partNumber: number;
    start: number;
  }) => {
    let attempt = 0;

    while (attempt < MAX_TRANSFER_ATTEMPTS) {
      try {
        const response = await fetch(url, {
          headers: {
            Range: `bytes=${start}-${end}`,
          },
        });

        if (!response.ok && response.status !== 206) {
          throw new Error(
            `Part ${partNumber} failed with status ${response.status}.`,
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        results[partNumber - 1] = arrayBuffer;
        downloadedBytesByPart[partNumber - 1] = arrayBuffer.byteLength;
        onProgress?.(
          downloadedBytesByPart.reduce(
            (total, currentValue) => total + currentValue,
            0,
          ),
        );
        return;
      } catch (error) {
        attempt += 1;
        downloadedBytesByPart[partNumber - 1] = 0;

        if (attempt >= MAX_TRANSFER_ATTEMPTS) {
          throw error;
        }

        await sleep(500 * 2 ** (attempt - 1) + Math.round(Math.random() * 300));
      }
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          MULTIPART_TRANSFER_CONCURRENCY,
          pendingParts.length,
        ),
      },
      async () => {
        while (pendingParts.length > 0) {
          const nextPart = pendingParts.shift();

          if (!nextPart) {
            return;
          }

          await downloadPart(nextPart);
        }
      },
    ),
  );

  const blob = new Blob(results.filter((value): value is ArrayBuffer => value !== null), {
    type: contentType,
  });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};
