export type OrderCheckoutStatus =
  | "paid"
  | "processing"
  | "unpaid"
  | "expired"
  | "no-payment-required";

export type OrderWorkflowStatus =
  | "awaiting-files"
  | "queued"
  | "in-progress"
  | "awaiting-feedback"
  | "revision-in-progress"
  | "completed"
  | "on-hold"
  | "cancelled";

export type OrderPaymentStatus = "paid" | "unpaid" | "no_payment_required";

export type OrderServiceType =
  | "mixing"
  | "mastering"
  | "mixing-and-mastering"
  | "studio-service";

export type OrderSongSourceType =
  | "mixing-tracks"
  | "mastering-file"
  | "mastering-stems";

export type OrderSongAssetKind = "source" | "deliverable";
export type OrderSongAssetValidationStatus = "valid" | "invalid";

export interface OrderListItemEntry {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

export interface OrderListItem {
  id: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerEmail: string | null;
  checkoutStatus: OrderCheckoutStatus;
  workflowStatus: OrderWorkflowStatus;
  paymentStatus: OrderPaymentStatus;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  orderedAt: string;
  items: OrderListItemEntry[];
}

export interface OrderSongAsset {
  id: string;
  orderId: string;
  songSpecId: string;
  assetKind: OrderSongAssetKind;
  validationStatus: OrderSongAssetValidationStatus;
  fileName: string;
  originalRelativePath: string | null;
  publicPath: string;
  mimeType: string | null;
  byteSize: number;
  durationSeconds: number | null;
  sampleRateHz: number | null;
  bitDepth: number | null;
  channelCount: number | null;
  validationMessages: string[];
  uploadedAt: string;
}

export interface OrderSongSpec {
  id: string;
  orderId: string;
  sessionName: string;
  songIndex: number;
  title: string;
  serviceType: OrderServiceType;
  sourceType: OrderSongSourceType;
  expectedDurationSeconds: number | null;
  durationToleranceSeconds: number;
  expectedSourceCount: number | null;
  expectedTrackCount: number | null;
  expectedStemCount: number | null;
  allowedSampleRates: number[];
  allowedBitDepths: number[];
  requirements: string[];
  sourceAssets: OrderSongAsset[];
  deliverableAssets: OrderSongAsset[];
}

export interface OrderDetail extends OrderListItem {
  serviceType: OrderServiceType;
  songSpecs: OrderSongSpec[];
  uploadsLocked: boolean;
  totalExpectedSourceFiles: number;
  totalUploadedSourceFiles: number;
  totalValidatedSourceFiles: number;
  sourceCompletionPercent: number;
  completedSongCount: number;
  requirementsSummary: string[];
  acceptedSourceExtensions: string[];
}
