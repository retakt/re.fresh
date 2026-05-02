import { useEffect } from "react";

interface PageMetaProps {
  /** Sets document.title and og:title / twitter:title */
  title: string;
  /** Sets meta[name="description"], og:description, twitter:description */
  description: string;
  /** Optional. When provided: sets og:image and switches twitter:card to summary_large_image */
  ogImage?: string;
  /** Optional. Sets og:url. Should be the canonical absolute URL for the page. */
  url?: string;
  /** Optional. Sets og:type. Defaults to "website". */
  type?: string;
}

const DEFAULTS = {
  title: "re.Takt",
  description: "Launching soon with curated content and creative resources.",
};

function setMeta(selector: string, attribute: string, value: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    // parse selector to set the right attribute (name or property)
    if (selector.includes('name="')) {
      el.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] ?? "");
    } else if (selector.includes('property="')) {
      el.setAttribute(
        "property",
        selector.match(/property="([^"]+)"/)?.[1] ?? "",
      );
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

export function PageMeta({
  title,
  description,
  ogImage,
  url,
  type = "website",
}: PageMetaProps) {
  useEffect(() => {
    // --- write ---
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);

    if (url) {
      setMeta('meta[property="og:url"]', "content", url);
    }
    setMeta('meta[property="og:type"]', "content", type);

    if (ogImage) {
      setMeta('meta[property="og:image"]', "content", ogImage);
      setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    } else {
      setMeta('meta[name="twitter:card"]', "content", "summary");
    }

    // --- restore on unmount ---
    return () => {
      document.title = DEFAULTS.title;
      setMeta('meta[name="description"]', "content", DEFAULTS.description);
      setMeta('meta[property="og:title"]', "content", DEFAULTS.title);
      setMeta('meta[property="og:description"]', "content", DEFAULTS.description);
      setMeta('meta[name="twitter:title"]', "content", DEFAULTS.title);
      setMeta('meta[name="twitter:description"]', "content", DEFAULTS.description);
      setMeta('meta[name="twitter:card"]', "content", "summary");
    };
  }, [title, description, ogImage, url, type]);

  return null;
}
