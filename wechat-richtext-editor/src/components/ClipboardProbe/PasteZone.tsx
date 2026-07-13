import { useState, type ClipboardEvent } from 'react';
import styles from './ClipboardProbe.module.css';

interface PasteZoneProps {
  onPaste: (event: ClipboardEvent) => void;
}

export function PasteZone({ onPaste }: PasteZoneProps) {
  const [label, setLabel] = useState('从微信公众号编辑器复制内容后，点击这里粘贴');

  const handlePaste = (event: ClipboardEvent) => {
    onPaste(event);
    setLabel('已捕获剪贴板内容，可继续粘贴覆盖');
  };

  return (
    <div
      className={styles.dropzone}
      tabIndex={0}
      contentEditable={false}
      role="button"
      aria-label="从微信公众号编辑器复制内容后，点击这里粘贴"
      onPaste={handlePaste}
    >
      {label}
    </div>
  );
}
