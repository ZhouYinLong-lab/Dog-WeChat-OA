import { useState } from 'react';
import type { AgentConfig } from '../../lib/types';
import { DEFAULT_AGENT_CONFIG } from '../../lib/constants';
import styles from './AgentPanel.module.css';

interface AgentFormProps {
  onLocalAgent: () => void;
  onCallLLM: (config: AgentConfig) => void;
  isLoading: boolean;
}

export function AgentForm({ onLocalAgent, onCallLLM, isLoading }: AgentFormProps) {
  const [config, setConfig] = useState<AgentConfig>({
    apiKey: '',
    baseUrl: DEFAULT_AGENT_CONFIG.baseUrl,
    model: DEFAULT_AGENT_CONFIG.model,
    prompt: DEFAULT_AGENT_CONFIG.prompt,
  });

  const update = (key: keyof AgentConfig, value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const handleCallLLM = () => onCallLLM(config);

  return (
    <div className={styles.agentForm}>
      <div className={styles.field}>
        <label htmlFor="promptInput">给 LLM 的任务</label>
        <textarea
          id="promptInput"
          rows={4}
          value={config.prompt}
          onChange={(e) => update('prompt', e.target.value)}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="apiBaseInput">OpenAI-compatible Base URL</label>
          <input
            id="apiBaseInput"
            value={config.baseUrl}
            onChange={(e) => update('baseUrl', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="modelInput">模型</label>
          <input
            id="modelInput"
            value={config.model}
            onChange={(e) => update('model', e.target.value)}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="apiKeyInput">API Key（仅保存在当前页面内存）</label>
        <input
          id="apiKeyInput"
          type="password"
          placeholder="可留空，使用下方本地规则演示"
          value={config.apiKey}
          onChange={(e) => update('apiKey', e.target.value)}
        />
      </div>
      <div className={styles.row}>
        <button onClick={onLocalAgent}>本地规则演示</button>
        <button className="primary" onClick={handleCallLLM} disabled={isLoading}>
          {isLoading ? '请求中...' : '调用 LLM 生成操作'}
        </button>
      </div>
    </div>
  );
}
