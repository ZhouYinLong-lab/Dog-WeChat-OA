/**
 * HTML sanitizer for content entering the editor from clipboard or Agent.
 * Preserves all security fixes from the code review.
 */
import { SANITIZE_REMOVE_SELECTOR } from './constants';
import { escapeHtml } from './dom-utils';

export function sanitizeForEditor(html: string): string {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');

  // Check for parser errors (malformed HTML)
  if (parsed.querySelector('parsererror')) {
    return escapeHtml(html);
  }

  // Remove dangerous elements
  parsed.querySelectorAll(SANITIZE_REMOVE_SELECTOR).forEach((node) => node.remove());

  // Remove dangerous attributes
  parsed.querySelectorAll('*').forEach((node) => {
    const el = node as HTMLElement;
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      // Remove event handlers
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }

      // Remove javascript: URLs (including namespace-qualified like xlink:href)
      if (
        (name === 'href' ||
          name === 'src' ||
          name.endsWith(':href') ||
          name.endsWith(':src')) &&
        value.startsWith('javascript:')
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return parsed.body.innerHTML;
}
