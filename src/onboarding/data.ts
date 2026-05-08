export type PageKind =
  | "chooseImage"
  | "embedWatermark"
  | "editImage"
  | "detectWatermark"
  | "pdfReport";

export interface OnboardingPage {
  readonly kind: PageKind;
  readonly title: string;
  readonly body: string;
  readonly staticPhase: number;
  readonly duration: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Geometry {
  readonly stage: {
    readonly width: number;
    readonly height: number;
    readonly centerX: number;
    readonly centerY: number;
  };
  readonly chooseImage: {
    readonly tileStarts: readonly Point[];
    readonly tileOffsets: readonly Point[];
    readonly flyInDuration: number;
    readonly highlightCycleDuration: number;
  };
  readonly embedWatermark: {
    readonly dotOffsets: readonly Point[];
  };
}

export const labels = {
  tutorialTitle: "Welcome to TraceMark",
  skip: "Skip",
  next: "Next",
  done: "Done",
  imageCode: "Image Code",
  watermarkDetected: "Watermark detected",
  searching: "Searching ...",
  matchFound: "Match found",
  crop: "Crop",
  draw: "Draw",
  compress: "Compress",
  watermark: "Watermark",
  similarity: "Similarity",
  metadata: "Metadata",
  pdfReport: "PDF Report",
} as const;

export const pages = [
  {
    kind: "chooseImage",
    title: "Choose an image",
    body: "Start from Photos, Files, pasteboard, or a shared image.",
    staticPhase: 0.78,
    duration: 4.8,
  },
  {
    kind: "embedWatermark",
    title: "Embed an invisible mark",
    body: "Add a machine-readable Image Code without placing a visible logo on the picture.",
    staticPhase: 0.84,
    duration: 3.8,
  },
  {
    kind: "editImage",
    title: "Edit before saving",
    body: "Crop, draw, compress, and tune the watermark before you save.",
    staticPhase: 0.86,
    duration: 4.0,
  },
  {
    kind: "detectWatermark",
    title: "Detect and match",
    body: "Scan an image, find its watermark, and compare it with TraceMarks on this device.",
    staticPhase: 0.82,
    duration: 4.0,
  },
  {
    kind: "pdfReport",
    title: "Create a PDF report",
    body: "Turn verification results, similarity, and metadata into a shareable report.",
    staticPhase: 0.88,
    duration: 4.1,
  },
] as const satisfies readonly OnboardingPage[];

export const geometry = {
  stage: {
    width: 390,
    height: 330,
    centerX: 195,
    centerY: 165,
  },
  chooseImage: {
    tileStarts: [
      { x: -160, y: -130 },
      { x: 150, y: -115 },
      { x: -145, y: 120 },
      { x: 165, y: 120 },
    ],
    tileOffsets: [
      { x: -58, y: -48 },
      { x: 58, y: -48 },
      { x: -58, y: 48 },
      { x: 58, y: 48 },
    ],
    flyInDuration: 1.35,
    highlightCycleDuration: 3.2,
  },
  embedWatermark: {
    dotOffsets: [
      { x: -72, y: -36 },
      { x: -38, y: -62 },
      { x: 12, y: -54 },
      { x: 58, y: -32 },
      { x: -86, y: 12 },
      { x: -44, y: 34 },
      { x: 0, y: 8 },
      { x: 42, y: 32 },
      { x: 82, y: 8 },
      { x: -30, y: 74 },
      { x: 28, y: 66 },
      { x: 74, y: 64 },
    ],
  },
} as const satisfies Geometry;

export const data = {
  geometry,
  labels,
  pages,
} as const;
