/**
 * useProbe — clipboard probe analysis hook.
 * Debounced analysis of editor HTML content.
 */
import { useRef, useCallback } from 'react';
import { analyzeHtml } from '../lib/analyzer';
import { validateWechatCompatibility } from '../lib/compatibility';
import { useEditorContext, useEditorActions } from './useEditorContext';
import { PROBE_DEBOUNCE_MS } from '../lib/constants';
import type { CompatIssue } from '../lib/types';

export function useProbe() {
  const { state } = useEditorContext();
  const { setProbe, setRawHtml } = useEditorActions();
  const timerRef = useRef<number | null>(null);

  /** Schedule a debounced probe update */
  const scheduleUpdate = useCallback(
    (getHtml: () => string) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        const html = getHtml();
        setRawHtml(html);
        setProbe(analyzeHtml(html));
      }, PROBE_DEBOUNCE_MS);
    },
    [setRawHtml, setProbe]
  );

  /** Immediate probe update (no debounce) */
  const updateNow = useCallback(
    (getHtml: () => string) => {
      const html = getHtml();
      setRawHtml(html);
      setProbe(analyzeHtml(html));
    },
    [setRawHtml, setProbe]
  );

  /** Get compatibility report for current HTML */
  const getCompatibility = useCallback((getHtml: () => string): CompatIssue[] => {
    return validateWechatCompatibility(getHtml());
  }, []);

  return {
    probe: state.lastProbe,
    scheduleUpdate,
    updateNow,
    getCompatibility,
  };
}
