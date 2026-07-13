/** All TypeScript type definitions for the WeChat richtext editor */

// ---- Tab types ----
export type TabType = 'summary' | 'html' | 'outline' | 'compatibility';

// ---- Agent operation types ----
export type OperationType = 'replace_text' | 'set_style' | 'insert_after' | 'delete_node';

export interface AgentOperation {
  type: OperationType;
  nodeId: string;
  oldText?: string;
  newText?: string;
  styles?: Record<string, string>;
  html?: string;
}

export interface AgentPayload {
  operations: AgentOperation[];
}

export interface OperationResult {
  ok: boolean;
  type: OperationType;
  nodeId?: string;
  reason?: string;
}

// ---- Probe / analysis types ----
export interface OutlineItem {
  index: number;
  tag: string;
  text: string;
  style: string;
}

export interface ProbeResult {
  tags: Record<string, number>;
  styles: Record<string, number>;
  images: string[];
  nodeCount: number;
  outline: OutlineItem[];
  htmlLength: number;
  textLength: number;
}

// ---- Compatibility types ----
export type CompatLevel = 'error' | 'warn' | 'pass';

export interface CompatIssue {
  level: CompatLevel;
  code: string;
  count: number;
  message: string;
}

// ---- History ----
export interface HistoryEntry {
  label: string;
  html: string;
  time: string;
}

// ---- Selection ----
export interface SelectionInfo {
  selection: Selection;
  range: Range;
  element: Element;
  nodeId: string | null;
  text: string;
}

// ---- Document view (sent to LLM) ----
export interface DocumentNode {
  id: string;
  tag: string;
  text: string;
  src?: string;
  style: string;
}

// ---- Editor state ----
export interface EditorState {
  rawHtml: string;
  importedRawHtml: string;
  currentTab: TabType;
  history: HistoryEntry[];
  redo: HistoryEntry[];
  lastProbe: ProbeResult | null;
  selectedNodeId: string | null;
}

// ---- Editor action types for reducer ----
export type EditorAction =
  | { type: 'LOAD_SAMPLE'; sample: string }
  | { type: 'IMPORT_HTML'; rawHtml: string; sanitized: string; clipboardTypes: string }
  | { type: 'SET_TAB'; tab: TabType }
  | { type: 'SET_RAW_HTML'; html: string }
  | { type: 'SET_PROBE'; probe: ProbeResult }
  | { type: 'SET_SELECTION'; nodeId: string | null }
  | { type: 'PUSH_HISTORY'; entry: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ---- Agent LLM config ----
export interface AgentConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
}

// ---- Agent status ----
export type AgentStatusType = '' | 'good' | 'warn' | 'bad';

export interface AgentStatus {
  message: string;
  type: AgentStatusType;
}
