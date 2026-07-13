/**
 * useAgent — LLM agent operations hook.
 * Handles LLM API calls and operation application in the iframe.
 */
import { useState, useCallback, useRef } from 'react';
import type {
  AgentOperation,
  AgentPayload,
  OperationResult,
  AgentConfig,
  AgentStatus,
  AgentStatusType,
  DocumentNode,
} from '../lib/types';
import { sanitizeForEditor } from '../lib/sanitizer';
import { FORBIDDEN_STYLE_KEYS, DEFAULT_SYSTEM_PROMPT } from '../lib/constants';

export function useAgent(
  getDoc: () => Document,
  assignIds: () => void,
  onStateChange: () => void
) {
  const [status, setStatus] = useState<AgentStatus>({
    message: 'Agent 只能返回 JSON 操作，不直接整篇重写 HTML。',
    type: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const setStatusMessage = useCallback((message: string, type: AgentStatusType = '') => {
    setStatus({ message, type });
  }, []);

  /** Generate local rule-based operations (no LLM call) */
  const makeLocalOperations = useCallback(
    (
      selectedText: string,
      nodeId: string
    ): AgentPayload | null => {
      if (!nodeId || !selectedText.trim()) {
        setStatusMessage('请先选中要演示修改的一段文字。', 'warn');
        return null;
      }

      const compactText = selectedText
        .replace(/\s+/g, ' ')
        .replace(/我们可以/g, '可')
        .replace(/非常/g, '很')
        .replace(/进行/g, '')
        .replace(/的一个/g, '的')
        .trim();

      return {
        operations: [
          {
            type: 'replace_text' as const,
            nodeId,
            oldText: selectedText,
            newText:
              compactText === selectedText.trim()
                ? `${compactText}（已由本地规则标记为待优化）`
                : compactText,
          },
          {
            type: 'set_style' as const,
            nodeId,
            styles: { color: '#146c94' },
          },
        ],
      };
    },
    [setStatusMessage]
  );

  /** Call LLM to generate operations */
  const callLLM = useCallback(
    async (config: AgentConfig, selectedNodeId: string | null, docView: DocumentNode[]) => {
      if (!config.apiKey) {
        setStatusMessage('没有 API Key。可以先点"本地规则演示"验证操作链路。', 'warn');
        return;
      }

      // Abort any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setStatusMessage('正在请求 LLM 生成结构化操作...', '');

      const body = {
        model: config.model,
        messages: [
          { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              task: config.prompt,
              selectedNodeId,
              selectedText: '',
              document: docView,
            }),
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' as const },
      };

      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const operations: AgentPayload = JSON.parse(content);

        setIsLoading(false);
        setStatusMessage('LLM 已返回操作 JSON，请检查后应用。', 'good');
        return operations;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setIsLoading(false);
        setStatusMessage(`调用失败：${(error as Error).message}`, 'bad');
        return null;
      }
    },
    [setStatusMessage]
  );

  /** Apply operations JSON to the iframe document */
  const applyOperations = useCallback(
    (payload: AgentPayload): OperationResult[] => {
      const doc = getDoc();
      const operations = payload.operations || [];
      const results: OperationResult[] = [];

      operations.forEach((op: AgentOperation) => {
        const node = op.nodeId
          ? (doc.querySelector(
              `[data-wxagent-id="${CSS.escape(op.nodeId)}"]`
            ) as HTMLElement | null)
          : null;

        if (op.type !== 'insert_after' && !node) {
          results.push({ ok: false, type: op.type, reason: 'node not found' });
          return;
        }

        if (op.type === 'replace_text') {
          const oldText = op.oldText || '';
          if (oldText && !node!.textContent?.includes(oldText)) {
            results.push({
              ok: false,
              type: op.type,
              reason: 'oldText not found in node',
              nodeId: op.nodeId,
            });
            return;
          }
          node!.textContent = oldText
            ? node!.textContent!.replace(oldText, op.newText || '')
            : (op.newText || '');
          results.push({ ok: true, type: op.type, nodeId: op.nodeId });
        }

        if (op.type === 'set_style') {
          Object.entries(op.styles || {}).forEach(([key, value]) => {
            if (FORBIDDEN_STYLE_KEYS.has(key)) return;
            (node!.style as unknown as Record<string, string>)[key] = value;
          });
          results.push({ ok: true, type: op.type, nodeId: op.nodeId });
        }

        if (op.type === 'insert_after') {
          const target = (node ||
            doc.querySelector(
              `[data-wxagent-id="${CSS.escape(op.nodeId)}"]`
            )) as HTMLElement | null;
          if (!target) {
            results.push({ ok: false, type: op.type, reason: 'target not found' });
            return;
          }
          const template = doc.createElement('template');
          template.innerHTML = sanitizeForEditor(op.html || '');
          target.after(template.content);
          results.push({ ok: true, type: op.type, nodeId: op.nodeId });
        }

        if (op.type === 'delete_node') {
          node!.remove();
          results.push({ ok: true, type: op.type, nodeId: op.nodeId });
        }
      });

      assignIds();
      onStateChange();
      setStatusMessage(
        `已应用 ${results.filter((item) => item.ok).length}/${operations.length} 个操作。`,
        'good'
      );
      return results;
    },
    [getDoc, assignIds, onStateChange, setStatusMessage]
  );

  return {
    status,
    isLoading,
    makeLocalOperations,
    callLLM,
    applyOperations,
    setStatusMessage,
  };
}
