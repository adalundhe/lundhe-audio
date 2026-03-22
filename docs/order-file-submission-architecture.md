# Order File Submission Architecture

## Goal

Move client source files off the application server and into durable object storage while keeping the order dashboard fast, resumable, and easy to retrieve from later.

## Current Gap

- Files are uploaded immediately to the Next.js app server.
- Source assets are stored under `public/order-assets/...`.
- There is no S3 abstraction, multipart upload flow, retry state, or resumable submission model.
- `workflowStatus` is currently overloaded for both client intake and engineer workflow.

## Recommended State Model

Keep `workflowStatus` for studio progress:

- `awaiting-files`
- `queued`
- `in-progress`
- `awaiting-feedback`
- `revision-in-progress`
- `completed`
- `on-hold`
- `cancelled`

Add a separate client intake / durable-upload status:

- `draft`
- `ready`
- `submitting`
- `submitted`
- `submit-failed`

The order detail page should eventually key the `Submit Files` button off `submissionStatus === "ready"` rather than `workflowStatus === "queued"`.

## Storage Layout

Use deterministic object keys so replacements and retrieval stay predictable:

```text
orders/{orderId}/songs/{songSpecId}/source/{slotKey}/{version}/{fileName}
orders/{orderId}/songs/{songSpecId}/deliverable/{assetId}/{fileName}
```

Where:

- `slotKey` is the logical file slot, such as `track-01`, `stem-02`, or `source-file`
- `version` increments on replacement
- `fileName` is the sanitized original filename

This keeps retrieval simple:

- list all files for an order by prefix `orders/{orderId}/`
- list files for a song by prefix `orders/{orderId}/songs/{songSpecId}/`
- replace a track without losing history

## Database Changes

### `order_song_assets`

Add:

- `storageProvider`
- `storageBucket`
- `storageRegion`
- `storageKey`
- `storageVersion`
- `slotKey`
- `uploadStatus`
- `checksumSha256`
- `submittedAt`
- `verifiedAt`

`uploadStatus` should be:

- `draft`
- `uploading`
- `uploaded`
- `verified`
- `failed`
- `superseded`

### New table: `order_asset_upload_sessions`

Tracks multipart state for resumability:

- `id`
- `orderId`
- `songSpecId`
- `assetId`
- `uploadId`
- `partSizeBytes`
- `partCount`
- `completedPartsJson`
- `status`
- `expiresAt`
- `createdAt`
- `updatedAt`

## API Shape

### 1. Prepare submission

`POST /api/account/orders/[orderId]/submissions/prepare`

Payload:

- `songSpecId`
- `assetId` or logical `slotKey`
- `fileName`
- `fileSize`
- `checksumSha256`
- `clientMetadata`
  - `durationSeconds`
  - `sampleRateHz`
  - `bitDepth`
  - `channelCount`

Server responsibilities:

- authenticate the Clerk user
- confirm the order belongs to the user
- validate requested file slots against the order rules
- create draft asset records
- choose single-part vs multipart upload
- create S3 multipart uploads when needed
- return upload instructions plus presigned URLs

### 2. Batch presigned parts

`POST /api/account/orders/[orderId]/submissions/part-urls`

Return URLs in windows instead of all at once to keep payloads small.

Recommended:

- 25 to 50 parts per response

### 3. Complete one file

`POST /api/account/orders/[orderId]/submissions/complete-file`

Payload:

- `assetId`
- `uploadId`
- completed parts with `PartNumber` and `ETag`

Server responsibilities:

- call `CompleteMultipartUpload`
- mark the asset as `uploaded`
- run server-side verification against the uploaded object

### 4. Finalize submission

`POST /api/account/orders/[orderId]/submissions/complete`

Server responsibilities:

- ensure every required asset is in `verified`
- mark submission `submitted`
- transition order intake state from `submitting` to `submitted`
- optionally transition `workflowStatus` to `queued`

## Validation Strategy

### Client-side

Keep fast local validation for UX before submission:

- file extension must be `.wav` or `.wave`
- parse WAV headers in-browser
- validate:
  - bit depth
  - sample rate
  - duration
  - max track / stem count

This gives instant feedback without uploading bad files.

### Server-side

Never trust client metadata alone.

After upload completes:

- use S3 `HeadObject` for size and basic metadata
- use a ranged `GetObject` on the first chunk to parse the WAV header
- validate again against the order song spec
- mark the asset `verified` only after server-side validation succeeds

WAV is a good fit for ranged validation because the required metadata is in the header.

## Upload Strategy

### Single-part vs multipart

- under `64 MiB`: presigned single `PUT`
- `64 MiB` and above: multipart upload

### Part sizing

Start with:

- `16 MiB` default part size
- increase to `32 MiB` or `64 MiB` for very large files
- keep the total part count comfortably below the S3 `10,000` part limit

### Concurrency

Recommended initial browser limits:

- `3` files uploading in parallel
- `4` parts per file in parallel
- `12` total requests in flight

Tune dynamically:

- reduce concurrency on slow connections
- increase to `16` total in-flight requests on fast desktop connections

## Retry and Resume

### Retry

For each part upload:

- exponential backoff
- jitter
- retry up to `5` times

On expired presigned URLs:

- request a fresh URL batch
- continue from the last successful part

### Resume

Persist client upload state in IndexedDB:

- `submissionId`
- `assetId`
- `uploadId`
- completed parts
- part size
- file fingerprint

If the tab reloads, the client can resume incomplete multipart uploads instead of restarting.

## Submit Modal

The submit modal should have 3 phases:

### 1. Ready

Show:

- songs ready count
- validated files count
- estimated total bytes
- any blocking validation issues

### 2. Uploading

Show:

- total progress bar
- per-file progress rows
- active retries
- current throughput
- ETA

### 3. Finalizing

Show:

- server verification progress
- completion summary
- any failed assets that need retry

The modal should stay open while uploading and support backgrounding the work if the user closes it.

## Recommended Packages

Add:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

Optional:

- a small IndexedDB helper for resumable client state

## Rollout Order

1. Add storage configuration and S3 client helpers.
2. Add submission status tables / columns.
3. Move WAV metadata parsing into a shared browser + server utility.
4. Build `prepare`, `part-urls`, `complete-file`, and `complete` endpoints.
5. Replace immediate server uploads with staged client files plus `Submit Files`.
6. Add resumable multipart uploads with IndexedDB.
7. Remove `public/order-assets/...` as the primary source storage path.
