/**
 * Pure DOM utility functions — no React dependency.
 * All functions operate on a given Document (the iframe's contentDocument).
 */

let _nodeIdSeq = 0;

/** Escape HTML special characters */
export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Assign unique data-wxagent-id to every tagable node that lacks one */
export function assignNodeIds(doc: Document): void {
  doc.body
    .querySelectorAll(
      'p, section, blockquote, li, td, th, h1, h2, h3, h4, h5, h6, img, span, strong, em:not([data-wxagent-id])'
    )
    .forEach((node) => {
      (node as HTMLElement).dataset.wxagentId = `n${++_nodeIdSeq}`;
    });
}

/** Get a cleaned clone of the iframe body (no editor attributes) */
export function getCleanClone(doc: Document): HTMLElement {
  const clone = doc.body.cloneNode(true) as HTMLElement;
  clone.removeAttribute('contenteditable');
  clone.querySelectorAll('*').forEach((node) => {
    node.classList.remove('wxagent-selected');
    (node as HTMLElement).removeAttribute('contenteditable');
    const el = node as HTMLElement;
    [...el.attributes].forEach((attr) => {
      if (attr.name.startsWith('data-wxagent')) {
        el.removeAttribute(attr.name);
      }
    });
    if (el.getAttribute('class') === '') {
      el.removeAttribute('class');
    }
  });
  return clone;
}

/** Get exportable innerHTML (cleaned, no editor attributes) */
export function getExportHtml(doc: Document): string {
  return getCleanClone(doc).innerHTML.trim();
}

/** Get plain text from the editor */
export function getPlainText(doc: Document): string {
  return (getCleanClone(doc).textContent || '').trim();
}

/** Get selection info from the iframe document */
export function getSelectionInfo(doc: Document): {
  selection: Selection;
  range: Range;
  element: Element;
  nodeId: string | null;
  text: string;
} | null {
  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  let element: Node | null =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
  element = (element as Element)?.closest('[data-wxagent-id]');
  return {
    selection,
    range,
    element: element as Element,
    nodeId: (element as HTMLElement)?.dataset.wxagentId || null,
    text: selection.toString(),
  };
}

/** Get a summarized document view for sending to the LLM */
export function getDocumentView(doc: Document): {
  id: string;
  tag: string;
  text: string;
  src?: string;
  style: string;
}[] {
  return [...doc.body.querySelectorAll('[data-wxagent-id]')]
    .filter((node) => {
      const text =
        node.tagName.toLowerCase() === 'img'
          ? (node as HTMLImageElement).getAttribute('src')
          : node.textContent;
      return (text || '').trim();
    })
    .slice(0, 120)
    .map((node) => ({
      id: (node as HTMLElement).dataset.wxagentId!,
      tag: node.tagName.toLowerCase(),
      text:
        node.tagName.toLowerCase() === 'img'
          ? ''
          : (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500),
      src:
        node.tagName.toLowerCase() === 'img'
          ? (node as HTMLImageElement).getAttribute('src') || undefined
          : undefined,
      style: (node as HTMLElement).getAttribute('style') || '',
    }));
}
