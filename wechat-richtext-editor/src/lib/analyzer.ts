/**
 * HTML analyzer — parses editor HTML and produces structured ProbeResult.
 * Pure function, no side effects.
 */
import type { ProbeResult, OutlineItem } from './types';
import { COUNTABLE_SELECTOR, OUTLINE_SELECTOR, MAX_OUTLINE_ITEMS } from './constants';

export function analyzeHtml(html: string): ProbeResult {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html || '', 'text/html');

  // Check for parser errors
  if (parsed.querySelector('parsererror')) {
    return {
      tags: {},
      styles: {},
      images: [],
      nodeCount: 0,
      outline: [],
      htmlLength: 0,
      textLength: 0,
    };
  }

  const tags = new Map<string, number>();
  const styles = new Map<string, number>();
  const images: string[] = [];
  let nodeCount = 0;

  parsed.body.querySelectorAll('*').forEach((node) => {
    const tag = node.tagName.toLowerCase();
    tags.set(tag, (tags.get(tag) || 0) + 1);

    // Count style properties
    const styleAttr = (node as HTMLElement).getAttribute('style');
    if (styleAttr) {
      styleAttr.split(';').forEach((item) => {
        const prop = item.split(':')[0]?.trim().toLowerCase();
        if (prop) styles.set(prop, (styles.get(prop) || 0) + 1);
      });
    }

    // Count operable nodes
    if (node.matches(COUNTABLE_SELECTOR)) nodeCount += 1;

    // Collect image sources
    if (tag === 'img') {
      images.push(
        (node as HTMLImageElement).getAttribute('data-src') ||
          (node as HTMLImageElement).getAttribute('src') ||
          ''
      );
    }
  });

  // Build outline
  const outline: OutlineItem[] = [
    ...parsed.body.querySelectorAll(OUTLINE_SELECTOR),
  ]
    .slice(0, MAX_OUTLINE_ITEMS)
    .map((node, index) => {
      const isImg = node.tagName.toLowerCase() === 'img';
      const text = isImg
        ? `[image] ${(node as HTMLImageElement).getAttribute('src') || ''}`
        : ((node.textContent || '').replace(/\s+/g, ' ').trim());
      return {
        index: index + 1,
        tag: node.tagName.toLowerCase(),
        text: text.slice(0, 120),
        style: (node as HTMLElement).getAttribute('style') || '',
      };
    });

  return {
    tags: Object.fromEntries([...tags.entries()].sort()),
    styles: Object.fromEntries([...styles.entries()].sort()),
    images,
    nodeCount,
    outline,
    htmlLength: html.length,
    textLength: (parsed.body.textContent || '').trim().length,
  };
}
