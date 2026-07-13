/**
 * useEditor — manages the contenteditable iframe lifecycle.
 * Provides all DOM read/write operations on the iframe document.
 */
import { useRef, useCallback, useState, useEffect, type RefObject } from 'react';
import { IFRAME_CSS } from '../lib/constants';
import {
  assignNodeIds,
  getExportHtml,
  getPlainText,
  getSelectionInfo,
  getDocumentView,
} from '../lib/dom-utils';
import { sanitizeForEditor } from '../lib/sanitizer';
import { analyzeHtml } from '../lib/analyzer';
import type { SelectionInfo, DocumentNode, ProbeResult } from '../lib/types';

export interface EditorAPI {
  /** Initialize iframe with HTML content */
  initFrame: (html?: string) => void;
  /** Execute a document.execCommand in the iframe */
  execCommand: (command: string, value?: string) => void;
  /** Get current selection info */
  getSelection: () => SelectionInfo | null;
  /** Get cleaned export HTML */
  getHtml: () => string;
  /** Get plain text */
  getText: () => string;
  /** Analyze current content */
  getProbe: () => ProbeResult;
  /** Get document view for LLM */
  getDocView: () => DocumentNode[];
  /** Apply inline style to selection */
  applyInlineStyle: (styles: Partial<CSSStyleDeclaration>) => void;
  /** Apply block style to selected element */
  applyBlockStyle: (styles: Partial<CSSStyleDeclaration>) => void;
  /** Wrap selection in a notice section */
  wrapAsNotice: () => void;
  /** Clear style from selected element */
  clearSelectedStyle: () => void;
  /** Update selection highlight in iframe */
  updateSelectionHighlight: () => string | null;
  /** Whether the iframe document is ready */
  ready: boolean;
}

export function useEditor(frameRef: RefObject<HTMLIFrameElement>): EditorAPI {
  const [ready, setReady] = useState(false);
  // Keep a mutable ref so callbacks always have the latest doc without re-creating
  const docRef = useRef<Document | null>(null);

  const getDoc = useCallback((): Document => {
    const frame = frameRef.current;
    if (!frame?.contentDocument) throw new Error('iframe not available');
    return frame.contentDocument;
  }, [frameRef]);

  // ---- Init ----
  const initFrame = useCallback(
    (html?: string) => {
      const frame = frameRef.current;
      if (!frame) return;
      const content =
        html ??
        '<p style="font-size:16px;line-height:1.8;color:#333;">请先从微信公众号编辑器复制内容并粘贴到左侧探针。</p>';

      const doc = frame.contentDocument || frame.contentWindow!.document;
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8"><style>${IFRAME_CSS}</style></head><body contenteditable="true">${content}</body></html>`
      );
      doc.close();
      docRef.current = doc;

      assignNodeIds(doc);
      setReady(true);
    },
    [frameRef]
  );

  // Initialize on mount
  useEffect(() => {
    // Small delay to ensure iframe is mounted
    const timer = setTimeout(() => initFrame(), 50);
    return () => clearTimeout(timer);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Commands ----
  const execCommand = useCallback(
    (command: string, value?: string) => {
      const doc = getDoc();
      frameRef.current?.contentWindow?.focus();
      doc.execCommand(command, false, value);
    },
    [getDoc, frameRef]
  );

  // ---- Selection ----
  const getSelection = useCallback((): SelectionInfo | null => {
    const doc = getDoc();
    return getSelectionInfo(doc) as SelectionInfo | null;
  }, [getDoc]);

  const updateSelectionHighlight = useCallback((): string | null => {
    const doc = getDoc();
    doc.querySelectorAll('.wxagent-selected').forEach((n) => n.classList.remove('wxagent-selected'));
    const info = getSelectionInfo(doc);
    if (info?.element) {
      info.element.classList.add('wxagent-selected');
      return info.nodeId;
    }
    return null;
  }, [getDoc]);

  // ---- Export ----
  const getHtml = useCallback((): string => {
    const doc = getDoc();
    return getExportHtml(doc);
  }, [getDoc]);

  const getText = useCallback((): string => {
    const doc = getDoc();
    return getPlainText(doc);
  }, [getDoc]);

  const getProbe = useCallback((): ProbeResult => {
    return analyzeHtml(getHtml());
  }, [getHtml]);

  const getDocView = useCallback((): DocumentNode[] => {
    const doc = getDoc();
    return getDocumentView(doc);
  }, [getDoc]);

  // ---- Inline/block style ----
  const applyInlineStyle = useCallback(
    (styles: Partial<CSSStyleDeclaration>) => {
      const doc = getDoc();
      const info = getSelectionInfo(doc);
      if (!info) return;

      const span = doc.createElement('span');
      Object.assign(span.style, styles);
      try {
        info.range.surroundContents(span);
      } catch {
        const contents = info.range.extractContents();
        span.appendChild(contents);
        info.range.insertNode(span);
      }
    },
    [getDoc]
  );

  const applyBlockStyle = useCallback(
    (styles: Partial<CSSStyleDeclaration>) => {
      const doc = getDoc();
      const info = getSelectionInfo(doc);
      if (!info?.element) return;
      Object.assign((info.element as HTMLElement).style, styles);
    },
    [getDoc]
  );

  const wrapAsNotice = useCallback(() => {
    const doc = getDoc();
    const info = getSelectionInfo(doc);
    if (!info) return;

    const section = doc.createElement('section');
    section.setAttribute(
      'style',
      'margin:16px 0;padding:14px 16px;background:#eef8fb;border-left:4px solid #146c94;border-radius:6px;color:#26343d;line-height:1.8;'
    );
    const contents = info.range.extractContents();
    section.appendChild(contents);
    info.range.insertNode(section);
  }, [getDoc]);

  const clearSelectedStyle = useCallback(() => {
    const doc = getDoc();
    const info = getSelectionInfo(doc);
    if (!info?.element) return;
    (info.element as HTMLElement).removeAttribute('style');
  }, [getDoc]);

  return {
    initFrame,
    execCommand,
    getSelection,
    getHtml,
    getText,
    getProbe,
    getDocView,
    applyInlineStyle,
    applyBlockStyle,
    wrapAsNotice,
    clearSelectedStyle,
    updateSelectionHighlight,
    ready,
  };
}

// Re-export sanitizeForEditor so consumers don't need to import from lib
export { sanitizeForEditor };
