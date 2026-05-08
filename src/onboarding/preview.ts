import { data } from "./data";
import { scenes, type OnboardingScene } from "./scenes";

type PreviewMode = "auto" | "scroll";
const sceneTransitionMs = 180;

function requireElement<T extends HTMLElement>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing onboarding element: ${selector}`);
  }

  return element;
}

export class OnboardingPreview {
  private selection = 0;
  private scene: OnboardingScene | null = null;
  private sceneStartedAt = performance.now();
  private rafId: number | null = null;
  private readonly motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  private resizeObserver: ResizeObserver | null = null;

  private frame!: HTMLElement;
  private page!: HTMLElement;
  private sceneRoot!: HTMLElement;
  private pageTitle!: HTMLElement;
  private pageBody!: HTMLElement;
  private dotsRoot!: HTMLElement;
  private actionButton!: HTMLButtonElement;
  private actionLabel!: HTMLElement;
  private readonly mode: PreviewMode;
  private transitionTimerId: number | null = null;

  constructor(private readonly root: HTMLElement) {
    this.mode = root.dataset.onboardingMode === "scroll" ? "scroll" : "auto";
    this.build();
    this.bind();
    this.setPage(0, false, false);
    this.updateScale();

    if (this.mode === "scroll") {
      this.root.classList.add("is-scroll-controlled");
    }

    this.startAnimation();
  }

  private build() {
    this.root.setAttribute(
      "aria-label",
      "TraceMark onboarding tutorial preview",
    );
    this.root.innerHTML = `
      <div class="onboarding-shell">
        <div class="onboarding-page">
          <div class="onboarding-animation-frame">
            <div class="onboarding-animation-scene" aria-hidden="true"></div>
          </div>
          <div class="onboarding-copy">
            <h3 class="onboarding-page-title"></h3>
            <p class="onboarding-page-body"></p>
          </div>
        </div>
        <div class="onboarding-footer">
          <div class="onboarding-dots" aria-hidden="true"></div>
          <button class="onboarding-action-button" data-onboarding-action type="button">
            <span class="onboarding-action-label"></span>
          </button>
        </div>
      </div>
    `;

    this.frame = requireElement(this.root, ".onboarding-animation-frame");
    this.page = requireElement(this.root, ".onboarding-page");
    this.sceneRoot = requireElement(this.root, ".onboarding-animation-scene");
    this.pageTitle = requireElement(this.root, ".onboarding-page-title");
    this.pageBody = requireElement(this.root, ".onboarding-page-body");
    this.dotsRoot = requireElement(this.root, ".onboarding-dots");
    this.actionButton = requireElement(this.root, ".onboarding-action-button");
    this.actionLabel = requireElement(this.root, ".onboarding-action-label");

    if (this.mode === "scroll") {
      this.actionButton.disabled = true;
      this.actionButton.setAttribute("aria-hidden", "true");
    }

    data.pages.forEach((page, index) => {
      const dot = document.createElement("span");
      dot.className = "onboarding-dot";
      dot.dataset.index = String(index);
      dot.dataset.kind = page.kind;
      this.dotsRoot.append(dot);
    });
  }

  private bind() {
    this.actionButton.addEventListener("click", () => {
      if (this.mode === "scroll") {
        return;
      }

      if (this.isLastPage()) {
        this.reset();
        return;
      }

      this.setPage(this.selection + 1);
    });

    this.motionQuery.addEventListener("change", () => {
      this.restartAnimation();
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateScale();
    });
    this.resizeObserver.observe(this.frame);
  }

  private isLastPage() {
    return this.selection === data.pages.length - 1;
  }

  private reset() {
    this.setPage(0);
  }

  private setPage(
    index: number,
    shouldRestart = true,
    shouldTransition = true,
  ) {
    const nextIndex = Math.max(0, Math.min(data.pages.length - 1, index));

    if (
      !shouldTransition ||
      !shouldRestart ||
      this.motionQuery.matches ||
      this.selection === nextIndex
    ) {
      if (this.transitionTimerId !== null) {
        window.clearTimeout(this.transitionTimerId);
        this.transitionTimerId = null;
      }

      this.page.classList.remove("is-changing-scene");
      this.applyPage(nextIndex, shouldRestart);
      return;
    }

    if (this.transitionTimerId !== null) {
      window.clearTimeout(this.transitionTimerId);
      this.transitionTimerId = null;
    }

    this.page.classList.add("is-changing-scene");

    this.transitionTimerId = window.setTimeout(() => {
      this.transitionTimerId = null;
      this.applyPage(nextIndex, shouldRestart);

      window.requestAnimationFrame(() => {
        this.page.classList.remove("is-changing-scene");
      });
    }, sceneTransitionMs);
  }

  private applyPage(index: number, shouldRestart = true) {
    this.selection = Math.max(0, Math.min(data.pages.length - 1, index));
    const page = data.pages[this.selection];
    const isLast = this.isLastPage();

    this.pageTitle.textContent = page.title;
    this.pageBody.textContent = page.body;
    this.actionLabel.textContent = isLast ? data.labels.done : data.labels.next;

    Array.from(this.dotsRoot.children).forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === this.selection);
    });

    this.scene = scenes.create(page.kind, this.sceneRoot);
    this.sceneStartedAt = performance.now();
    this.renderFrame(this.sceneStartedAt);

    if (shouldRestart) {
      this.restartAnimation();
    }
  }

  private updateScale() {
    const frameRect = this.frame.getBoundingClientRect();
    const scale = Math.min(
      frameRect.width / data.geometry.stage.width,
      frameRect.height / data.geometry.stage.height,
    );

    this.root.style.setProperty(
      "--onboarding-stage-scale",
      Math.max(0.1, Math.min(scale, 2.2)).toFixed(4),
    );
  }

  private restartAnimation() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.startAnimation();
  }

  private startAnimation() {
    const tick = (now: number) => {
      this.renderFrame(now);

      if (!this.motionQuery.matches) {
        this.rafId = window.requestAnimationFrame(tick);
      }
    };

    this.rafId = window.requestAnimationFrame(tick);
  }

  public showPage(index: number) {
    const nextIndex = Math.max(0, Math.min(data.pages.length - 1, index));

    if (nextIndex !== this.selection) {
      this.setPage(nextIndex);
    }
  }

  public restartAtPage(index: number) {
    this.setPage(index, true, false);
  }

  public destroy() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.transitionTimerId !== null) {
      window.clearTimeout(this.transitionTimerId);
      this.transitionTimerId = null;
    }

    this.page.classList.remove("is-changing-scene");
    this.resizeObserver?.disconnect();
  }

  private renderFrame(now: number) {
    if (!this.scene) {
      return;
    }

    const page = data.pages[this.selection];
    const reduceMotion = this.motionQuery.matches;
    const rawElapsed = reduceMotion
      ? page.staticPhase * page.duration
      : (now - this.sceneStartedAt) / 1000;
    const shouldHoldFinalFrame = this.mode === "scroll";
    const elapsed =
      shouldHoldFinalFrame && !reduceMotion
        ? Math.min(rawElapsed, page.duration)
        : rawElapsed;
    const phase = reduceMotion
      ? page.staticPhase
      : shouldHoldFinalFrame
        ? Math.min(rawElapsed / page.duration, 1)
        : (rawElapsed % page.duration) / page.duration;

    this.scene.update({
      elapsed,
      phase,
      duration: page.duration,
      reduceMotion,
    });
  }
}

export function setupOnboardingPreviews(): OnboardingPreview[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-onboarding-preview]"),
  ).flatMap((root) => {
    if (root.dataset.onboardingReady) {
      return [];
    }

    root.dataset.onboardingReady = "true";
    return [new OnboardingPreview(root)];
  });
}
