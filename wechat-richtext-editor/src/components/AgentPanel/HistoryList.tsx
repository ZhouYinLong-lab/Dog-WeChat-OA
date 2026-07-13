import type { HistoryEntry } from '../../lib/types';
import styles from './AgentPanel.module.css';

interface HistoryListProps {
  entries: HistoryEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
  if (entries.length === 0) return null;

  return (
    <div className={styles.opList}>
      {entries.map((item, i) => (
        <div className={styles.opItem} key={i}>
          <b>{escapeHtml(item.label)}</b>
          <span className={styles.muted}>{item.time}</span>
        </div>
      ))}
    </div>
  );
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
