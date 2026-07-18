import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteUrl = "https://www.orby.co.in";
const socialImage = `${siteUrl}/assets/screen-recorder-hero.jpg`;

type PageSeo = {
  title: string;
  description: string;
  index?: boolean;
};

const defaultSeo: PageSeo = {
  title: "Orby — Free Private Online Screen Recorder",
  description:
    "Record your screen, browser tab, webcam, and microphone online for free with Orby. Private, high-quality recording with no uploads required.",
};

const pageSeo: Record<string, PageSeo> = {
  "/": defaultSeo,
  "/studio": {
    title: "Record Your Screen, Webcam & Audio Online | Orby",
    description:
      "Record your screen, browser tab, webcam, microphone, and system audio online with Orby. Free, private, and processed locally in your browser.",
  },
  "/recordings": {
    title: "Your Local Recordings | Orby",
    description: "View and manage recordings stored privately on this device.",
    index: false,
  },
  "/privacy": {
    title: "Private & Local Screen Recording | Orby",
    description:
      "Learn how Orby keeps screen, webcam, microphone, and recording data private by processing and storing recordings locally on your device.",
  },
  "/open-source": {
    title: "Open-Source Browser Screen Recorder | Orby",
    description:
      "Explore Orby, an open-source screen, webcam, and audio recorder that runs privately in your browser.",
  },
};

function setMeta(selector: string, attribute: string, content: string) {
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  element?.setAttribute(attribute, content);
}

export function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
    const seo = pageSeo[normalizedPath] ?? defaultSeo;
    const canonicalUrl = `${siteUrl}${normalizedPath === "/" ? "/" : normalizedPath}`;

    document.title = seo.title;
    setMeta('meta[name="description"]', "content", seo.description);
    setMeta(
      'meta[name="robots"]',
      "content",
      seo.index === false
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    setMeta('meta[property="og:title"]', "content", seo.title);
    setMeta('meta[property="og:description"]', "content", seo.description);
    setMeta('meta[property="og:url"]', "content", canonicalUrl);
    setMeta('meta[property="og:image"]', "content", socialImage);
    setMeta('meta[name="twitter:title"]', "content", seo.title);
    setMeta('meta[name="twitter:description"]', "content", seo.description);
    setMeta('meta[name="twitter:image"]', "content", socialImage);

    document.head
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", canonicalUrl);
  }, [pathname]);

  return null;
}
