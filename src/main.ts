import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { data } from "./onboarding/data";
import {
  setupOnboardingPreviews,
  type OnboardingPreview,
} from "./onboarding/preview";

gsap.registerPlugin(ScrollTrigger);

type Theme = "light" | "dark";

type RoundtripSegment = {
  start: number;
  title: string;
  description: string;
};

const themeStorageKey = "tracemark-theme";
const storySceneHoldSeconds = 3;
const roundtripSegments: readonly RoundtripSegment[] = [
  {
    start: 0,
    title: "Mark the Image Before It Travels",
    description:
      "Choose the image you want to share, then embed a resilient invisible code that travels with the file without changing how it looks.",
  },
  {
    start: 9,
    title: "Add Context People Can Trust",
    description:
      "Confirm the watermark details, then add a clear title and description so the image carries useful context when it is checked later.",
  },
  {
    start: 17,
    title: "Share the Protected Copy",
    description:
      "Copy the finished watermarked image directly from TraceMark and use it wherever the conversation is happening.",
  },
  {
    start: 31,
    title: "Find the Mark on the Return Trip",
    description:
      "Bring the shared image back into the app and TraceMark detects the embedded watermark, reconnecting the file to its original context.",
  },
];

function readStoredTheme(): Theme | null {
  try {
    const theme = window.localStorage.getItem(themeStorageKey);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The visual mode still works when storage is unavailable.
  }
}

function setupTheme() {
  const root = document.documentElement;
  const themeToggle = document.querySelector<HTMLButtonElement>(
    "[data-theme-toggle], #themeToggle",
  );
  const themeLabel = document.querySelector<HTMLElement>(
    "[data-theme-label], #themeLabel",
  );
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const preferredTheme = (): Theme =>
    readStoredTheme() || (mediaQuery.matches ? "dark" : "light");

  const applyTheme = (theme: Theme) => {
    root.dataset.theme = theme;

    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    themeLabel?.replaceChildren(nextTheme === "dark" ? "Dark" : "Light");
    themeToggle?.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggle?.setAttribute("title", `Switch to ${nextTheme} mode`);
  };

  applyTheme(preferredTheme());

  themeToggle?.addEventListener("click", () => {
    const nextTheme: Theme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
  });

  mediaQuery.addEventListener("change", (event) => {
    if (!readStoredTheme()) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });
}

function makeText(codes: readonly number[]) {
  return String.fromCharCode(...codes);
}

function buildAddress() {
  const local = makeText([
    102, 105, 99, 104, 101, 46, 109, 101, 114, 114, 105, 101, 114, 95,
    48, 115,
  ]);
  const name = makeText([105, 99, 108, 111, 117, 100]);
  const suffix = makeText([99, 111, 109]);
  return `${local}@${name}.${suffix}`;
}

function setupContactButtons() {
  const openMail = () => {
    const subject = encodeURIComponent("TraceMark inquiry");
    window.location.href = `mailto:${buildAddress()}?subject=${subject}`;
  };

  document.querySelectorAll<HTMLElement>("[data-contact-button]").forEach(
    (button) => {
      button.addEventListener("click", openMail);
    },
  );
}

function getRoundtripSegmentIndex(time: number) {
  const currentTime = Math.max(0, time);
  let segmentIndex = 0;

  for (let index = 0; index < roundtripSegments.length; index += 1) {
    if (currentTime >= roundtripSegments[index].start) {
      segmentIndex = index;
    }
  }

  return segmentIndex;
}

function setupRoundtripVideo() {
  const video = document.querySelector<HTMLVideoElement>(
    "[data-roundtrip-video]",
  );
  const title = document.querySelector<HTMLElement>("[data-roundtrip-title]");
  const description = document.querySelector<HTMLElement>(
    "[data-roundtrip-description]",
  );

  if (!video || !title || !description) {
    return;
  }

  let activeSegmentIndex = -1;

  const updateCopy = () => {
    const nextSegmentIndex = getRoundtripSegmentIndex(video.currentTime);

    if (nextSegmentIndex === activeSegmentIndex) {
      return;
    }

    const segment = roundtripSegments[nextSegmentIndex];
    activeSegmentIndex = nextSegmentIndex;
    title.replaceChildren(segment.title);
    description.replaceChildren(segment.description);
  };

  updateCopy();

  video.addEventListener("loadedmetadata", updateCopy);
  video.addEventListener("play", updateCopy);
  video.addEventListener("timeupdate", updateCopy);
  video.addEventListener("seeked", updateCopy);
}

function getRequiredElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function setupLandingScroll(previews: readonly OnboardingPreview[]) {
  const hero = getRequiredElement<HTMLElement>("[data-hero]");
  const heroContent = getRequiredElement<HTMLElement>("[data-hero-content]");
  const story = getRequiredElement<HTMLElement>("[data-scroll-story]");
  const storyVisual = getRequiredElement<HTMLElement>("[data-story-visual]");
  const preview = previews[0];

  if (!hero || !heroContent || !story || !storyVisual || !preview) {
    return;
  }

  let activeIndex = 0;
  let timerId: number | null = null;
  let isStoryRunning = false;
  const pageCount = data.pages.length;

  const clearStoryTimer = () => {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNextScene = () => {
    clearStoryTimer();

    if (!isStoryRunning) {
      return;
    }

    const page = data.pages[activeIndex];
    const duration =
      (Math.max(2.4, page.duration) + storySceneHoldSeconds) * 1000;

    timerId = window.setTimeout(() => {
      activeIndex = (activeIndex + 1) % pageCount;
      preview.showPage(activeIndex);
      scheduleNextScene();
    }, duration);
  };

  const startStoryAutoplay = () => {
    activeIndex = 0;
    isStoryRunning = true;
    preview.restartAtPage(0);
    scheduleNextScene();
  };

  const stopStoryAutoplay = () => {
    isStoryRunning = false;
    clearStoryTimer();
  };

  gsap
    .timeline({
      scrollTrigger: {
        id: "landing-hero",
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.7,
      },
    })
    .to(heroContent, {
      autoAlpha: 0,
      ease: "none",
      scale: 0.92,
      y: -84,
    });

  const media = gsap.matchMedia();

  media.add("(min-width: 721px)", () => {
    gsap.fromTo(
      storyVisual,
      {
        autoAlpha: 0,
        xPercent: 22,
      },
      {
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: {
          id: "landing-story-visual",
          trigger: story,
          start: "top 86%",
          toggleActions: "play none none reverse",
        },
        xPercent: 0,
      },
    );

    const trigger = ScrollTrigger.create({
      end: "bottom 22%",
      id: "landing-story-autoplay",
      onEnter: startStoryAutoplay,
      onEnterBack: startStoryAutoplay,
      onLeave: stopStoryAutoplay,
      onLeaveBack: stopStoryAutoplay,
      start: "top 64%",
      trigger: story,
    });

    return () => {
      stopStoryAutoplay();
      trigger.kill();
    };
  });

  media.add("(max-width: 720px)", () => {
    const trigger = ScrollTrigger.create({
      end: "bottom 12%",
      id: "landing-mobile-story-autoplay",
      onEnter: startStoryAutoplay,
      onEnterBack: startStoryAutoplay,
      onLeave: stopStoryAutoplay,
      onLeaveBack: stopStoryAutoplay,
      start: "top 72%",
      trigger: story,
    });

    return () => {
      stopStoryAutoplay();
      trigger.kill();
    };
  });
}

function boot() {
  setupTheme();
  setupContactButtons();
  setupRoundtripVideo();
  const previews = setupOnboardingPreviews();
  setupLandingScroll(previews);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
