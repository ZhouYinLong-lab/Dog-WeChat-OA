/**
 * EditorContext — central state management for the editor.
 * Uses React Context + useReducer pattern.
 * All components read/write editor state through this context.
 */
import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { EditorState, EditorAction, TabType, HistoryEntry, ProbeResult } from '../lib/types';
import { INITIAL_STATE } from '../lib/constants';

// ---- Reducer ----
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_SAMPLE':
      return {
        ...INITIAL_STATE,
        importedRawHtml: action.sample,
      };

    case 'IMPORT_HTML':
      return {
        ...INITIAL_STATE,
        importedRawHtml: action.rawHtml,
        rawHtml: action.sanitized,
      };

    case 'SET_TAB':
      return { ...state, currentTab: action.tab };

    case 'SET_RAW_HTML':
      return { ...state, rawHtml: action.html };

    case 'SET_PROBE':
      return { ...state, lastProbe: action.probe };

    case 'SET_SELECTION':
      return { ...state, selectedNodeId: action.nodeId };

    case 'PUSH_HISTORY':
      return { ...state, history: [...state.history, action.entry].slice(-50), redo: [] };

    case 'UNDO': {
      if (state.history.length < 2) return state;
      const newHistory = [...state.history];
      const current = newHistory.pop()!;
      return { ...state, history: newHistory, redo: [...state.redo, current] };
    }

    case 'REDO': {
      if (state.redo.length === 0) return state;
      const newRedo = [...state.redo];
      const next = newRedo.pop()!;
      return { ...state, history: [...state.history, next], redo: newRedo };
    }

    default:
      return state;
  }
}

// ---- Context ----
interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, INITIAL_STATE);
  return <EditorContext.Provider value={{ state, dispatch }}>{children}</EditorContext.Provider>;
}

export function useEditorContext() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used within EditorProvider');
  return ctx;
}

// ---- Convenience action creators ----
export function useEditorActions() {
  const { dispatch } = useEditorContext();

  return {
    loadSample: useCallback(
      (sample: string) => dispatch({ type: 'LOAD_SAMPLE', sample }),
      [dispatch]
    ),
    importHtml: useCallback(
      (rawHtml: string, sanitized: string, clipboardTypes: string) =>
        dispatch({ type: 'IMPORT_HTML', rawHtml, sanitized, clipboardTypes }),
      [dispatch]
    ),
    setTab: useCallback(
      (tab: TabType) => dispatch({ type: 'SET_TAB', tab }),
      [dispatch]
    ),
    setRawHtml: useCallback(
      (html: string) => dispatch({ type: 'SET_RAW_HTML', html }),
      [dispatch]
    ),
    setProbe: useCallback(
      (probe: ProbeResult) => dispatch({ type: 'SET_PROBE', probe }),
      [dispatch]
    ),
    setSelection: useCallback(
      (nodeId: string | null) => dispatch({ type: 'SET_SELECTION', nodeId }),
      [dispatch]
    ),
    pushHistory: useCallback(
      (entry: HistoryEntry) => dispatch({ type: 'PUSH_HISTORY', entry }),
      [dispatch]
    ),
    undo: useCallback(() => dispatch({ type: 'UNDO' }), [dispatch]),
    redo: useCallback(() => dispatch({ type: 'REDO' }), [dispatch]),
  };
}
