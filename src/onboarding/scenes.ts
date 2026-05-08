import {
  BadgeCheck,
  Check,
  Crop,
  FileText,
  Hash,
  Image as ImageIcon,
  Images,
  Minimize2,
  Pencil,
  ScanSearch,
  Share2,
  createElement as createLucideElement,
} from "lucide";
import { data, type PageKind } from "./data";

export interface RenderState {
  readonly elapsed: number;
  readonly phase: number;
  readonly duration: number;
  readonly reduceMotion: boolean;
}

export interface OnboardingScene {
  update(state: RenderState): void;
}

type SceneConstructor = new (root: HTMLElement) => OnboardingScene;
type Tint = "cyan" | "green" | "red";

interface StatusBadge {
  readonly root: HTMLDivElement;
  readonly icon: HTMLSpanElement;
  readonly label: HTMLSpanElement;
  update(nextText: string, nextSystemName: string, nextTint: Tint): void;
}

interface SliderTrack {
  readonly root: HTMLDivElement;
  update(progress: number): void;
}

interface CropCorners {
  readonly root: SVGSVGElement;
  update(progress: number): void;
}

interface DrawingStroke {
  readonly root: SVGSVGElement;
  update(progress: number): void;
}

interface Waveform {
  readonly root: SVGSVGElement;
  update(phase: number): void;
}

interface VerificationRow {
  readonly root: HTMLDivElement;
  readonly check: HTMLSpanElement;
  update(progress: number): void;
}

interface PDFSheet {
  readonly root: HTMLDivElement;
  update(progress: number): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const stage = data.geometry.stage;
type IconDefinition = typeof ImageIcon;

const iconMap = {
  photo: ImageIcon,
  number: Hash,
  "checkmark.seal.fill": BadgeCheck,
  checkmark: Check,
  crop: Crop,
  "pencil.tip": Pencil,
  "rectangle.compress.vertical": Minimize2,
  "waveform.badge.magnifyingglass": ScanSearch,
  "rectangle.stack.badge.plus": Images,
  "doc.richtext.fill": FileText,
  "square.and.arrow.up.fill": Share2,
} satisfies Record<string, IconDefinition>;

type IconName = keyof typeof iconMap;

function isIconName(systemName: string): systemName is IconName {
  return systemName in iconMap;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function segment(phase: number, start: number, end: number): number {
  if (end <= start) {
    return 0;
  }

  return clamp((phase - start) / (end - start), 0, 1);
}

export function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    node.setAttribute(name, String(value));
  });

  return node;
}

function setSize(
  node: HTMLElement | SVGElement,
  width: number,
  height: number,
) {
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
}

function place(
  node: HTMLElement | SVGElement,
  x: number,
  y: number,
  scale = 1,
  opacity?: number,
) {
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.opacity = opacity === undefined ? "" : String(opacity);
  node.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function symbol(systemName: string, className?: string): HTMLSpanElement {
  const node = el("span", `ob-icon${className ? ` ${className}` : ""}`);
  setSymbol(node, systemName);
  node.setAttribute("aria-hidden", "true");
  return node;
}

function setSymbol(node: HTMLElement, systemName: string) {
  node.dataset.symbol = systemName;
  const iconNode = iconMap[isIconName(systemName) ? systemName : "photo"];
  const svg = createLucideElement(iconNode, {
    "aria-hidden": "true",
    focusable: "false",
    "stroke-width": 2.2,
  });

  svg.classList.add("ob-icon-svg");
  node.replaceChildren(svg);
}

function createPhotoTile(index: number): HTMLDivElement {
  const tile = el("div", `ob-photo-tile ob-photo-tile-${index}`);

  tile.append(symbol("photo", "ob-card-image-icon"));
  setSize(tile, 104, 86);
  return tile;
}

function createImageCard(options: {
  readonly width: number;
  readonly height: number;
  readonly variant?: number;
}): { readonly root: HTMLDivElement; readonly pixelOverlay: HTMLDivElement } {
  const card = el("div", `ob-large-card${options.variant ? " is-alt" : ""}`);
  const interior = el("div", "ob-large-card-interior");
  const imageIcon = symbol("photo", "ob-card-image-icon");
  const pixelOverlay = el("div", "ob-pixel-overlay");

  setSize(card, options.width, options.height);
  interior.append(imageIcon, pixelOverlay);
  card.append(interior);

  return {
    root: card,
    pixelOverlay,
  };
}

function createChip(text: string, systemName: string): HTMLDivElement {
  const chip = el("div", "ob-chip");
  chip.append(symbol(systemName, "ob-chip-symbol"), el("span", "", text));
  return chip;
}

function createStatusBadge(
  text: string,
  systemName: string,
  tint: Tint,
): StatusBadge {
  const badge = el("div", `ob-status-badge is-${tint}`);
  const icon = symbol(systemName, "ob-status-symbol");
  const label = el("span", "ob-status-label", text);

  badge.append(icon, label);

  return {
    root: badge,
    icon,
    label,
    update(nextText: string, nextSystemName: string, nextTint: Tint) {
      label.textContent = nextText;
      setSymbol(icon, nextSystemName);
      badge.classList.remove("is-cyan", "is-green", "is-red");
      badge.classList.add(`is-${nextTint}`);
    },
  };
}

function createToolPill(text: string, systemName: string): HTMLDivElement {
  const pill = el("div", "ob-tool-pill");
  pill.append(symbol(systemName, "ob-tool-symbol"), el("span", "", text));
  return pill;
}

function setActivePill(pill: HTMLElement, isActive: boolean) {
  pill.classList.toggle("is-active", isActive);
}

function createSliderTrack(): SliderTrack {
  const root = el("div", "ob-slider-track");
  const rail = el("div", "ob-slider-rail");
  const fill = el("div", "ob-slider-fill");
  const knob = el("div", "ob-slider-knob");

  root.append(rail, fill, knob);

  return {
    root,
    update(progress: number) {
      const knobX = 18 + (220 - 36) * progress;
      fill.style.width = `${Math.max(10, knobX)}px`;
      knob.style.transform = `translate(${knobX - 15}px, -50%)`;
    },
  };
}

function cropCornerPath(
  width: number,
  height: number,
  progress: number,
): string {
  const length = Math.min(width, height) * (0.18 + 0.08 * progress);
  const maxX = width;
  const maxY = height;

  return [
    `M 0 ${length}`,
    "L 0 0",
    `L ${length} 0`,
    `M ${maxX - length} 0`,
    `L ${maxX} 0`,
    `L ${maxX} ${length}`,
    `M ${maxX} ${maxY - length}`,
    `L ${maxX} ${maxY}`,
    `L ${maxX - length} ${maxY}`,
    `M ${length} ${maxY}`,
    `L 0 ${maxY}`,
    `L 0 ${maxY - length}`,
  ].join(" ");
}

function waveformPath(phase: number): string {
  const width = 160;
  const height = 54;
  const steps = 48;
  const points: string[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const percent = step / steps;
    const x = width * percent;
    const angle = (percent * 4.4 + phase * 2) * Math.PI;
    const y = height / 2 + Math.sin(angle) * height * 0.34;
    points.push(`${step === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(" ");
}

function createCropCorners(): CropCorners {
  const root = svgEl("svg", {
    class: "ob-crop-corners",
    fill: "none",
    "aria-hidden": "true",
  });
  const path = svgEl("path", {
    stroke: "currentColor",
    "stroke-width": "4",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });

  root.append(path);

  return {
    root,
    update(progress: number) {
      const width = 218 - 34 * progress;
      const height = 232 - 50 * progress;
      setSize(root, width, height);
      root.setAttribute("viewBox", `0 0 ${width} ${height}`);
      path.setAttribute("d", cropCornerPath(width, height, progress));
    },
  };
}

function createDrawingStroke(): DrawingStroke {
  const root = svgEl("svg", {
    class: "ob-drawing-stroke",
    viewBox: "0 0 160 88",
    fill: "none",
    "aria-hidden": "true",
  });
  const path = svgEl("path", {
    d: "M 6 68 C 42 34 38 6 72 26 C 108 68 112 86 154 48",
    stroke: "url(#drawingStrokeGradient)",
    "stroke-width": "8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    pathLength: "1",
    "stroke-dasharray": "1",
  });
  const defs = svgEl("defs");
  const gradient = svgEl("linearGradient", {
    id: "drawingStrokeGradient",
    x1: "0",
    y1: "0",
    x2: "160",
    y2: "0",
    gradientUnits: "userSpaceOnUse",
  });

  [
    ["0", "#facc15"],
    ["0.55", "#fb923c"],
    ["1", "#ec4899"],
  ].forEach(([offset, color]) => {
    gradient.append(svgEl("stop", { offset, "stop-color": color }));
  });

  defs.append(gradient);
  root.append(defs, path);

  return {
    root,
    update(progress: number) {
      root.style.opacity = progress > 0 ? "1" : "0";
      path.setAttribute("stroke-dashoffset", String(1 - progress));
    },
  };
}

function createWaveform(): Waveform {
  const root = svgEl("svg", {
    class: "ob-waveform",
    viewBox: "0 0 160 54",
    fill: "none",
    "aria-hidden": "true",
  });
  const path = svgEl("path", {
    stroke: "currentColor",
    "stroke-width": "4",
    "stroke-linecap": "round",
  });

  root.append(path);

  return {
    root,
    update(phase: number) {
      path.setAttribute("d", waveformPath(phase));
    },
  };
}

function createVerificationRow(text: string): VerificationRow {
  const root = el("div", "ob-verification-row");
  const checkWrap = el("span", "ob-verification-check");
  const check = symbol("checkmark", "ob-verification-symbol");

  checkWrap.append(check);
  root.append(checkWrap, el("span", "ob-verification-text", text));

  return {
    root,
    check,
    update(progress: number) {
      root.style.opacity = String(0.25 + 0.75 * progress);
      root.style.transform = `translateY(${16 * (1 - progress)}px)`;
      check.style.transform = `scale(${progress})`;
    },
  };
}

function createPDFSheet(): PDFSheet {
  const root = el("div", "ob-pdf-sheet");
  const fold = el("div", "ob-pdf-fold");
  const content = el("div", "ob-pdf-content");
  const title = el("strong", "ob-pdf-title", "PDF");

  content.append(title);

  [98, 124, 84, 112].forEach((width, index) => {
    const line = el("span", `ob-pdf-line ob-pdf-line-${index}`);
    line.style.width = `${width}px`;
    content.append(line);
  });

  root.append(fold, content);

  return {
    root,
    update(progress: number) {
      fold.style.opacity = String(progress);
    },
  };
}

function createSourceBubble(systemName: string): HTMLDivElement {
  const bubble = el("div", "ob-source-bubble");
  bubble.append(symbol(systemName, "ob-source-symbol"));
  return bubble;
}

class ChooseImageScene implements OnboardingScene {
  private static readonly selectedIndex = 3;
  private static readonly tileWidth = 104;
  private static readonly tileHeight = 86;

  private readonly tiles: HTMLDivElement[] = [];

  constructor(root: HTMLElement) {
    root.textContent = "";

    for (let index = 0; index < 4; index += 1) {
      const tile = createPhotoTile(index);
      this.tiles.push(tile);
      root.append(tile);
    }
  }

  update(state: RenderState) {
    const config = data.geometry.chooseImage;
    const sceneTime = state.reduceMotion
      ? state.duration
      : state.phase * state.duration;
    const gather = state.reduceMotion
      ? 1
      : smooth(clamp(sceneTime / config.flyInDuration, 0, 1));
    const highlightElapsed = Math.max(0, sceneTime - config.flyInDuration);
    const tileDuration = config.highlightCycleDuration / 4;
    const selectionStart = config.flyInDuration + tileDuration * 3;
    const selectionProgress = state.reduceMotion
      ? 1
      : smooth(segment(sceneTime, selectionStart, state.duration));
    const isSelecting = selectionProgress > 0 || sceneTime >= selectionStart;
    const cycleTime = highlightElapsed % config.highlightCycleDuration;
    const highlightedIndex = state.reduceMotion
      ? -1
      : isSelecting
        ? -1
        : Math.min(
            ChooseImageScene.selectedIndex - 1,
            Math.floor(cycleTime / tileDuration),
          );
    const tileTime = cycleTime % tileDuration;
    const rawProgress = tileTime / tileDuration;
    const highlightProgress = state.reduceMotion
      ? 0
      : smooth(rawProgress < 0.5 ? rawProgress * 2 : (1 - rawProgress) * 2);
    const selectedAspectRatio =
      ChooseImageScene.tileWidth / ChooseImageScene.tileHeight;
    const clusterWidth =
      Math.max(...config.tileOffsets.map((offset) => Math.abs(offset.x))) * 2 +
      ChooseImageScene.tileWidth;
    const clusterHeight =
      Math.max(...config.tileOffsets.map((offset) => Math.abs(offset.y))) * 2 +
      ChooseImageScene.tileHeight;
    const selectedWidth = Math.min(
      clusterWidth,
      clusterHeight * selectedAspectRatio,
    );
    const selectedHeight = selectedWidth / selectedAspectRatio;

    this.tiles.forEach((tile, index) => {
      const offset = config.tileOffsets[index];
      const start = config.tileStarts[index];
      const gridX = stage.centerX + offset.x + start.x * (1 - gather);
      const gridY = stage.centerY + offset.y + start.y * (1 - gather);
      const gridScale =
        index === highlightedIndex ? 1 + 0.28 * highlightProgress : 1;
      const isSelected = index === ChooseImageScene.selectedIndex;
      const x = isSelected
        ? mix(gridX, stage.centerX, selectionProgress)
        : gridX;
      const y = isSelected
        ? mix(gridY, stage.centerY, selectionProgress)
        : gridY;
      const scale = isSelected ? 1 : gridScale;
      const opacity = isSelected ? 1 : 1 - selectionProgress;
      const width = isSelected
        ? mix(ChooseImageScene.tileWidth, selectedWidth, selectionProgress)
        : ChooseImageScene.tileWidth;
      const height = isSelected
        ? mix(ChooseImageScene.tileHeight, selectedHeight, selectionProgress)
        : ChooseImageScene.tileHeight;

      setSize(tile, width, height);
      place(tile, x, y, scale, opacity);
      tile.style.zIndex = isSelected
        ? "4"
        : index === highlightedIndex
          ? "3"
          : "1";
    });
  }
}

class EmbedWatermarkScene implements OnboardingScene {
  private readonly card: HTMLDivElement;
  private readonly scanLine: HTMLDivElement;
  private readonly chip: HTMLDivElement;
  private readonly dots: HTMLSpanElement[];
  private readonly badge: StatusBadge;

  constructor(root: HTMLElement) {
    const card = createImageCard({ width: 210, height: 240, variant: 0 });
    this.card = card.root;
    this.scanLine = el("div", "ob-scan-line");
    this.chip = createChip(data.labels.imageCode, "number");
    this.dots = data.geometry.embedWatermark.dotOffsets.map((_, index) =>
      el("span", `ob-watermark-dot ${index % 2 === 0 ? "is-cyan" : "is-mint"}`),
    );
    this.badge = createStatusBadge(
      data.labels.watermarkDetected,
      "checkmark.seal.fill",
      "green",
    );

    root.textContent = "";
    root.append(
      this.card,
      this.scanLine,
      this.chip,
      ...this.dots,
      this.badge.root,
    );
  }

  update(state: RenderState) {
    const scan = smooth(segment(state.phase, 0.05, 0.42));
    const embed = smooth(segment(state.phase, 0.38, 0.68));
    const check = smooth(segment(state.phase, 0.68, 0.86));

    place(this.card, stage.centerX, stage.centerY, 1, 1);
    place(
      this.scanLine,
      stage.centerX,
      stage.centerY - 104 + 208 * scan,
      1,
      state.phase < 0.58 ? 1 : Math.max(0, 1 - embed * 1.4),
    );
    place(
      this.chip,
      stage.centerX,
      stage.centerY - 4,
      1 - 0.18 * embed,
      1 - embed,
    );
    place(
      this.badge.root,
      stage.centerX,
      stage.centerY + 138,
      0.82 + 0.18 * check,
      check,
    );

    this.dots.forEach((dot, index) => {
      const offset = data.geometry.embedWatermark.dotOffsets[index];
      place(
        dot,
        stage.centerX + offset.x * embed,
        stage.centerY - 4 + offset.y * embed,
        1,
        embed * (1 - check),
      );
    });
  }
}

class EditImageScene implements OnboardingScene {
  private readonly card: HTMLDivElement;
  private readonly pixelOverlay: HTMLDivElement;
  private readonly crop: CropCorners;
  private readonly stroke: DrawingStroke;
  private readonly toolStack: HTMLDivElement;
  private readonly toolRow: HTMLDivElement;
  private readonly cropPill: HTMLDivElement;
  private readonly drawPill: HTMLDivElement;
  private readonly compressPill: HTMLDivElement;
  private readonly slider: SliderTrack;

  constructor(root: HTMLElement) {
    const card = createImageCard({ width: 216, height: 230, variant: 0 });
    this.card = card.root;
    this.pixelOverlay = card.pixelOverlay;
    this.crop = createCropCorners();
    this.stroke = createDrawingStroke();
    this.toolStack = el("div", "ob-tool-stack");
    this.toolRow = el("div", "ob-tool-row");
    this.cropPill = createToolPill(data.labels.crop, "crop");
    this.drawPill = createToolPill(data.labels.draw, "pencil.tip");
    this.compressPill = createToolPill(
      data.labels.compress,
      "rectangle.compress.vertical",
    );
    this.slider = createSliderTrack();

    this.toolRow.append(this.cropPill, this.drawPill, this.compressPill);
    this.toolStack.append(this.toolRow, this.slider.root);

    root.textContent = "";
    root.append(this.card, this.stroke.root, this.crop.root, this.toolStack);
  }

  update(state: RenderState) {
    const crop = smooth(segment(state.phase, 0.06, 0.3));
    const draw = smooth(segment(state.phase, 0.3, 0.58));
    const compress = smooth(segment(state.phase, 0.58, 0.86));
    const centerY = stage.centerY - 6;

    place(this.card, stage.centerX, centerY, 1, 1);
    this.pixelOverlay.style.opacity = String(compress * 0.42);
    this.pixelOverlay.style.backgroundSize = `${8 + compress * 11}px ${
      8 + compress * 11
    }px`;

    this.stroke.update(draw);
    place(this.stroke.root, stage.centerX, centerY + 8, 1, draw > 0 ? 1 : 0);

    this.crop.update(crop);
    place(this.crop.root, stage.centerX, centerY, 1, 1);

    setActivePill(this.cropPill, state.phase < 0.34);
    setActivePill(this.drawPill, state.phase >= 0.34 && state.phase < 0.62);
    setActivePill(this.compressPill, state.phase >= 0.62);

    this.slider.update(compress);
    this.slider.root.style.opacity = String(0.25 + 0.75 * compress);
    place(this.toolStack, stage.centerX, stage.height - 46, 1, 1);
  }
}

class DetectWatermarkScene implements OnboardingScene {
  private readonly leftCard: HTMLDivElement;
  private readonly rightCard: HTMLDivElement;
  private readonly waveform: Waveform;
  private readonly topBadge: StatusBadge;
  private readonly bottomBadge: StatusBadge;

  constructor(root: HTMLElement) {
    const leftCard = createImageCard({ width: 190, height: 218, variant: 0 });
    const rightCard = createImageCard({ width: 146, height: 170, variant: 1 });

    this.leftCard = leftCard.root;
    this.rightCard = rightCard.root;
    this.waveform = createWaveform();
    this.topBadge = createStatusBadge(
      data.labels.searching,
      "waveform.badge.magnifyingglass",
      "cyan",
    );
    this.bottomBadge = createStatusBadge(
      data.labels.matchFound,
      "rectangle.stack.badge.plus",
      "green",
    );

    root.textContent = "";
    root.append(
      this.leftCard,
      this.waveform.root,
      this.rightCard,
      this.topBadge.root,
      this.bottomBadge.root,
    );
  }

  update(state: RenderState) {
    const scan = smooth(segment(state.phase, 0.06, 0.42));
    const detected = smooth(segment(state.phase, 0.4, 0.58));
    const match = smooth(segment(state.phase, 0.58, 0.86));
    const leftX = stage.centerX - 54 * match;
    const rightX = stage.centerX + 74 + 120 * (1 - match);

    place(this.leftCard, leftX, stage.centerY - 4, 1 - 0.12 * match, 1);
    this.waveform.update(state.phase);
    place(
      this.waveform.root,
      leftX,
      stage.centerY - 82 + 150 * scan,
      1,
      1 - detected * 0.3,
    );
    place(
      this.rightCard,
      rightX,
      stage.centerY + 18,
      0.86 + 0.14 * match,
      match,
    );

    if (state.phase < 0.48) {
      this.topBadge.update(
        data.labels.searching,
        "waveform.badge.magnifyingglass",
        "cyan",
      );
    } else {
      this.topBadge.update(
        data.labels.watermarkDetected,
        "checkmark.seal.fill",
        "green",
      );
    }

    place(this.topBadge.root, stage.centerX, 46, 1, 1);
    place(
      this.bottomBadge.root,
      stage.centerX,
      stage.height - 44,
      0.84 + 0.16 * match,
      match,
    );
  }
}

class PDFReportScene implements OnboardingScene {
  private readonly rows: VerificationRow[];
  private readonly rowGroup: HTMLDivElement;
  private readonly sheet: PDFSheet;
  private readonly badge: StatusBadge;
  private readonly sourceBubble: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.rows = [
      createVerificationRow(data.labels.watermark),
      createVerificationRow(data.labels.similarity),
      createVerificationRow(data.labels.metadata),
    ];
    this.rowGroup = el("div", "ob-verification-stack");
    this.sheet = createPDFSheet();
    this.badge = createStatusBadge(
      data.labels.pdfReport,
      "doc.richtext.fill",
      "red",
    );
    this.sourceBubble = createSourceBubble("square.and.arrow.up.fill");

    this.rows.forEach((row) => this.rowGroup.append(row.root));

    root.textContent = "";
    root.append(
      this.rowGroup,
      this.sheet.root,
      this.badge.root,
      this.sourceBubble,
    );
  }

  update(state: RenderState) {
    const row1 = smooth(segment(state.phase, 0.06, 0.24));
    const row2 = smooth(segment(state.phase, 0.22, 0.4));
    const row3 = smooth(segment(state.phase, 0.38, 0.56));
    const fold = smooth(segment(state.phase, 0.56, 0.78));
    const share = smooth(segment(state.phase, 0.76, 0.92));

    this.rows[0].update(row1);
    this.rows[1].update(row2);
    this.rows[2].update(row3);

    place(
      this.rowGroup,
      stage.centerX,
      stage.centerY - 20 - 24 * fold,
      1 - 0.12 * fold,
      1 - fold,
    );
    this.sheet.update(fold);
    place(
      this.sheet.root,
      stage.centerX,
      stage.centerY,
      0.7 + 0.3 * fold,
      fold,
    );
    place(this.badge.root, stage.centerX, stage.centerY + 138, 1, fold);
    place(
      this.sourceBubble,
      stage.centerX + 106,
      stage.centerY - 86 - 26 * share,
      0.75 + 0.25 * share,
      share,
    );
  }
}

const sceneConstructors = {
  chooseImage: ChooseImageScene,
  embedWatermark: EmbedWatermarkScene,
  editImage: EditImageScene,
  detectWatermark: DetectWatermarkScene,
  pdfReport: PDFReportScene,
} satisfies Record<PageKind, SceneConstructor>;

export const scenes = {
  create(kind: PageKind, root: HTMLElement): OnboardingScene {
    const SceneConstructor = sceneConstructors[kind];
    return new SceneConstructor(root);
  },
};
