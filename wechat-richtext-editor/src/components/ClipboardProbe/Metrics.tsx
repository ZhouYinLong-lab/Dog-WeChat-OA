import type { ProbeResult } from '../../lib/types';
import styles from './ClipboardProbe.module.css';

interface MetricsProps {
  probe: ProbeResult | null;
}

export function Metrics({ probe }: MetricsProps) {
  const tagCount = probe ? Object.keys(probe.tags).length : 0;
  const styleCount = probe ? Object.keys(probe.styles).length : 0;
  const imageCount = probe ? probe.images.length : 0;
  const nodeCount = probe ? probe.nodeCount : 0;

  return (
    <div className={styles.metaGrid}>
      <div className={styles.metric}>
        <b>{tagCount}</b>
        <span>标签种类</span>
      </div>
      <div className={styles.metric}>
        <b>{styleCount}</b>
        <span>样式属性</span>
      </div>
      <div className={styles.metric}>
        <b>{imageCount}</b>
        <span>图片</span>
      </div>
      <div className={styles.metric}>
        <b>{nodeCount}</b>
        <span>可操作节点</span>
      </div>
    </div>
  );
}
