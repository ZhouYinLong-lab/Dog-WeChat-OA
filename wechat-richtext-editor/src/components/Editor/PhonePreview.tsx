import type { RefObject } from 'react';
import styles from './Editor.module.css';

interface PhonePreviewProps {
  frameRef: RefObject<HTMLIFrameElement>;
}

export function PhonePreview({ frameRef }: PhonePreviewProps) {
  return (
    <div className={styles.phoneStage}>
      <div className={styles.phone}>
        <div className={styles.phoneTop}>公众号预览宽度</div>
        <iframe
          ref={frameRef}
          title="微信公众号富文本编辑区"
          className={styles.editorFrame}
        />
      </div>
    </div>
  );
}
