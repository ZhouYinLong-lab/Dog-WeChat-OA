import type { TabType } from '../../lib/types';
import styles from './ClipboardProbe.module.css';

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'summary', label: '摘要' },
  { key: 'html', label: '原始 HTML' },
  { key: 'outline', label: '结构' },
  { key: 'compatibility', label: '兼容性' },
];

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className={styles.tabs}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={activeTab === tab.key ? styles.active : ''}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
