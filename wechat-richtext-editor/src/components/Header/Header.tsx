import styles from './Header.module.css';

interface HeaderProps {
  onLoadSample: () => void;
  onExportHtml: () => void;
  onCopy: () => void;
}

export function Header({ onLoadSample, onExportHtml, onCopy }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <div className={styles.mark}>微</div>
        <div>
          <h1>微信公众号富文本往返编辑器</h1>
          <div className={styles.sub}>
            复制进来保留 HTML 片段，手动或 Agent 修改，再以富文本复制回公众号编辑器
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={onLoadSample}>载入示例</button>
        <button onClick={onExportHtml}>导出 HTML</button>
        <button className="primary" onClick={onCopy}>
          复制回公众号
        </button>
      </div>
    </header>
  );
}
