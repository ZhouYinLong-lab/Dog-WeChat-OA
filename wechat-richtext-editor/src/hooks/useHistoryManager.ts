/**
 * useHistoryManager — undo/redo stack management for the editor.
 */
import { useCallback } from 'react';
import { useEditorContext, useEditorActions } from './useEditorContext';
import type { HistoryEntry } from '../lib/types';

export function useHistoryManager(getBodyHtml: () => string, restoreHtml: (html: string) => void) {
  const { state } = useEditorContext();
  const { pushHistory, undo, redo } = useEditorActions();

  /** Save current state to history (deduplicates by innerHTML) */
  const save = useCallback(
    (label: string) => {
      const html = getBodyHtml();
      const last = state.history[state.history.length - 1];
      if (last && last.html === html) return;

      const entry: HistoryEntry = {
        label,
        html,
        time: new Date().toLocaleTimeString(),
      };

      pushHistory(entry);
    },
    [getBodyHtml, state.history, pushHistory]
  );

  /** Undo: restore previous state */
  const undoAction = useCallback(() => {
    if (state.history.length < 2) return;
    undo();
    // After dispatch, restore the previous entry's HTML
    const prev = state.history[state.history.length - 2];
    restoreHtml(prev.html);
  }, [state.history, undo, restoreHtml]);

  /** Redo: restore next state */
  const redoAction = useCallback(() => {
    if (state.redo.length === 0) return;
    const next = state.redo[state.redo.length - 1];
    redo();
    restoreHtml(next.html);
  }, [state.redo, redo, restoreHtml]);

  return {
    entries: state.history,
    save,
    undo: undoAction,
    redo: redoAction,
    canUndo: state.history.length >= 2,
    canRedo: state.redo.length > 0,
  };
}
