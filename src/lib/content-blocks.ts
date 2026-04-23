export type ContentBlock = {
  id: string;
  tagName: string;
  html: string;
  text: string;
  canAnchor: boolean;
};

function isAnchorable(tagName: string) {
  return ["P", "H1", "H2", "H3", "H4", "H5", "H6"].includes(tagName);
}

export function parseContentBlocks(html: string) {
  if (typeof window === "undefined") {
    return [] as ContentBlock[];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes = Array.from(doc.body.children);

  return nodes.map((node, index) => {
    const tagName = node.tagName;
    return {
      id: `block-${index + 1}`,
      tagName,
      html: node.outerHTML,
      text: (node.textContent ?? "").trim(),
      canAnchor: isAnchorable(tagName),
    } satisfies ContentBlock;
  });
}

export function getBlockLabel(block: ContentBlock) {
  const trimmed = block.text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return block.tagName.toLowerCase();
  }

  return trimmed.length > 90 ? `${trimmed.slice(0, 87)}...` : trimmed;
}
