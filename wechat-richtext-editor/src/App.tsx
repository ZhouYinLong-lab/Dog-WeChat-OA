import { useRef, useCallback, useState } from 'react';
import { useEditor, sanitizeForEditor } from './hooks/useEditor';
import { useHistoryManager } from './hooks/useHistoryManager';
import { useProbe } from './hooks/useProbe';
import { useAgent } from './hooks/useAgent';
import { useClipboard } from './hooks/useClipboard';
import { useEditorContext, useEditorActions } from './hooks/useEditorContext';
import { escapeHtml, assignNodeIds } from './lib/dom-utils';
import { analyzeHtml } from './lib/analyzer';
import type { AgentPayload, AgentConfig, AgentStatusType } from './lib/types';
import { DEFAULT_SAMPLE } from './lib/constants';

import { Header } from './components/Header/Header';
import { PasteZone } from './components/ClipboardProbe/PasteZone';
import { Metrics } from './components/ClipboardProbe/Metrics';
import { Tabs } from './components/ClipboardProbe/Tabs';
import { ProbeOutput } from './components/ClipboardProbe/ProbeOutput';
import { Toolbar } from './components/Editor/Toolbar';
import { PhonePreview } from './components/Editor/PhonePreview';
import { AgentForm } from './components/AgentPanel/AgentForm';
import { HistoryList } from './components/AgentPanel/HistoryList';
import { validateWechatCompatibility } from './lib/compatibility';

import styles from './App.module.css';

export function App() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const opsRef = useRef<HTMLPreElement>(null);
  const { state } = useEditorContext();
  const { loadSample, importHtml, setTab } = useEditorActions();

  // Unified status display
  const [statusMsg, setStatusMsg] = useState('Agent 只能返回 JSON 操作，不直接整篇重写 HTML。');
  const [statusType, setStatusType] = useState<AgentStatusType>('');

  const editor = useEditor(frameRef);

  const getDoc = useCallback(() => {
    if (!frameRef.current?.contentDocument) throw new Error('iframe not ready');
    return frameRef.current.contentDocument;
  }, []);

  // Probe management
  const probe = useProbe();
  const updateProbe = useCallback(() => {
    const html = editor.getHtml();
    analyzeHtml(html); // ensure probe data is fresh
    probe.updateNow(() => html);
  }, [editor, probe]);

  const scheduleProbe = useCallback(() => {
    probe.scheduleUpdate(() => editor.getHtml());
  }, [editor, probe]);

  // History management
  const history = useHistoryManager(
    useCallback(() => getDoc().body.innerHTML, [getDoc]),
    useCallback(
      (html: string) => {
        const doc = getDoc();
        doc.body.innerHTML = html;
        assignNodeIds(doc);
      },
      [getDoc]
    )
  );

  // Agent
  const agent = useAgent(
    getDoc,
    useCallback(() => assignNodeIds(getDoc()), [getDoc]),
    updateProbe
  );

  // Clipboard
  const setStatus = useCallback((msg: string, type: AgentStatusType = '') => {
    setStatusMsg(msg);
    setStatusType(type);
  }, []);

  const clipboard = useClipboard(setStatus);

  // Selection tracking
  const updateSelection = useCallback(() => {
    editor.updateSelectionHighlight();
    const badge = document.getElementById('selectionBadge');
    if (badge) {
      const info = editor.getSelection();
      badge.textContent = info?.nodeId || '未选中';
    }
  }, [editor]);

  // --- Handlers ---

  const handleLoadSample = useCallback(() => {
    editor.initFrame(DEFAULT_SAMPLE);
    loadSample(DEFAULT_SAMPLE);
    updateProbe();
    setStatus('示例已载入。', 'good');
  }, [editor, loadSample, updateProbe, setStatus]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      event.preventDefault();
      let types: string[], html: string, plain: string;
      try {
        const data = event.clipboardData;
        types = [...data.types];
        html = data.getData('text/html');
        plain = data.getData('text/plain');
      } catch (err) {
        setStatus(`无法读取剪贴板：${(err as Error).message}`, 'bad');
        return;
      }

      const incoming = html || escapeHtml(plain).replace(/\n/g, '<br>');
      const sanitized = sanitizeForEditor(incoming);
      editor.initFrame(sanitized);
      importHtml(incoming, sanitized, types.join(', ') || '未知');
      updateProbe();
      setStatus('已导入剪贴板 HTML。', 'good');
    },
    [editor, importHtml, updateProbe, setStatus]
  );

  const handleCopy = useCallback(async () => {
    await clipboard.copyWechatContent(editor.getHtml(), editor.getText());
  }, [editor, clipboard]);

  const handleDownload = useCallback(() => {
    clipboard.downloadHtml(editor.getHtml());
  }, [editor, clipboard]);

  const handleToolbarCommand = useCallback(
    (command: string, _value?: string | null) => {
      editor.execCommand(command);
      updateSelection();
      scheduleProbe();
    },
    [editor, updateSelection, scheduleProbe]
  );

  const handleApplyInlineStyle = useCallback(
    (styles: Partial<CSSStyleDeclaration>) => {
      editor.applyInlineStyle(styles);
      updateSelection();
      scheduleProbe();
    },
    [editor, updateSelection, scheduleProbe]
  );

  const handleApplyBlockStyle = useCallback(
    (styles: Partial<CSSStyleDeclaration>) => {
      editor.applyBlockStyle(styles);
      updateSelection();
      scheduleProbe();
    },
    [editor, updateSelection, scheduleProbe]
  );

  const handleWrapNotice = useCallback(() => {
    editor.wrapAsNotice();
    updateSelection();
    scheduleProbe();
  }, [editor, updateSelection, scheduleProbe]);

  const handleClearStyle = useCallback(() => {
    editor.clearSelectedStyle();
    updateSelection();
    scheduleProbe();
  }, [editor, updateSelection, scheduleProbe]);

  const handleLocalAgent = useCallback(() => {
    const info = editor.getSelection();
    if (!info?.nodeId || !info.text.trim()) {
      setStatus('请先选中要演示修改的一段文字。', 'warn');
      return;
    }
    const payload = agent.makeLocalOperations(info.text, info.nodeId);
    if (!payload) return;
    if (opsRef.current) {
      opsRef.current.textContent = JSON.stringify(payload, null, 2);
    }
    setStatus('已生成本地规则操作 JSON，请检查后应用。', 'good');
  }, [editor, agent, setStatus]);

  const handleCallLLM = useCallback(
    async (config: AgentConfig) => {
      const info = editor.getSelection();
      const docView = editor.getDocView();
      const result = await agent.callLLM(config, info?.nodeId || null, docView);
      if (result && opsRef.current) {
        opsRef.current.textContent = JSON.stringify(result, null, 2);
      }
    },
    [editor, agent]
  );

  const handleApplyOps = useCallback(() => {
    if (!opsRef.current) return;
    try {
      const payload: AgentPayload = JSON.parse(opsRef.current.textContent || '{}');
      agent.applyOperations(payload);
      updateProbe();
    } catch (err) {
      setStatus(`JSON 解析失败：${(err as Error).message}`, 'bad');
    }
  }, [agent, updateProbe, setStatus]);

  const handleUndo = useCallback(() => {
    history.undo();
    updateProbe();
  }, [history, updateProbe]);

  const handleRedo = useCallback(() => {
    history.redo();
    updateProbe();
  }, [history, updateProbe]);

  // --- Derived data ---
  const probeData = state.lastProbe;
  const compatIssues = probeData ? validateWechatCompatibility(state.rawHtml) : [];

  // Status CSS class
  const statusClass = [
    styles.status,
    statusType === 'good' ? styles.good : '',
    statusType === 'warn' ? styles.warn : '',
    statusType === 'bad' ? styles.bad : '',
  ]
    .join(' ')
    .trim();

  return (
    <div className={styles.app}>
      <Header
        onLoadSample={handleLoadSample}
        onExportHtml={handleDownload}
        onCopy={handleCopy}
      />
      <main className={styles.layout}>
        {/* Left: Clipboard Probe */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>剪贴板探针</h2>
            <span className={styles.badge}>
              {state.importedRawHtml ? '已导入' : '未导入'}
            </span>
          </div>
          <div className={styles.panelBody}>
            <PasteZone onPaste={handlePaste} />
            <p className={styles.hint}>
              探针会读取剪贴板里的 <code>text/html</code> 和 <code>text/plain</code>
              ，并统计标签、样式和图片。
            </p>
            <Metrics probe={probeData} />
            <Tabs activeTab={state.currentTab} onTabChange={setTab} />
            <ProbeOutput
              tab={state.currentTab}
              probe={probeData}
              rawHtml={state.importedRawHtml || state.rawHtml}
              compatIssues={compatIssues}
              getExportHtml={() => editor.getHtml()}
            />
          </div>
        </section>

        {/* Center: Editor */}
        <section className={styles.editorShell}>
          <Toolbar
            onCommand={handleToolbarCommand}
            onInlineStyle={handleApplyInlineStyle}
            onBlockStyle={handleApplyBlockStyle}
            onWrapNotice={handleWrapNotice}
            onClearStyle={handleClearStyle}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
          />
          <PhonePreview frameRef={frameRef} />
        </section>

        {/* Right: Agent Panel */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Agent 操作</h2>
            <span className={styles.badge} id="selectionBadge">
              {state.selectedNodeId || '未选中'}
            </span>
          </div>
          <div className={styles.panelBody}>
            <AgentForm
              onLocalAgent={handleLocalAgent}
              onCallLLM={handleCallLLM}
              isLoading={agent.isLoading}
            />
            <div className={statusClass} aria-live="polite">
              {statusMsg}
            </div>
            <pre ref={opsRef}>{`{\n  "operations": []\n}`}</pre>
            <button className={styles.applyBtn} onClick={handleApplyOps}>
              应用上方操作 JSON
            </button>
            <HistoryList entries={history.entries.slice(-5).reverse()} />
          </div>
        </section>
      </main>
    </div>
  );
}
