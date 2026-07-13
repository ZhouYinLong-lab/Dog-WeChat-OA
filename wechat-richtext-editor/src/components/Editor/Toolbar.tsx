import styles from './Editor.module.css';

interface ToolbarProps {
  onCommand: (command: string, value?: string | null) => void;
  onInlineStyle: (styles: Partial<CSSStyleDeclaration>) => void;
  onBlockStyle: (styles: Partial<CSSStyleDeclaration>) => void;
  onWrapNotice: () => void;
  onClearStyle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Toolbar({
  onCommand,
  onInlineStyle,
  onBlockStyle,
  onWrapNotice,
  onClearStyle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <button
        className={styles.iconBtn}
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销"
      >
        ↶
      </button>
      <button
        className={styles.iconBtn}
        onClick={onRedo}
        disabled={!canRedo}
        title="重做"
      >
        ↷
      </button>
      <button className={styles.iconBtn} onClick={() => onCommand('bold')} title="加粗">
        B
      </button>
      <button className={styles.iconBtn} onClick={() => onCommand('italic')} title="斜体">
        I
      </button>
      <button className={styles.iconBtn} onClick={() => onCommand('underline')} title="下划线">
        U
      </button>

      <select
        className={styles.toolSelect}
        title="字号"
        onChange={(e) => {
          if (e.target.value) {
            onInlineStyle({ fontSize: e.target.value } as Partial<CSSStyleDeclaration>);
            e.target.value = '';
          }
        }}
        defaultValue=""
      >
        <option value="">字号</option>
        <option value="14px">14</option>
        <option value="15px">15</option>
        <option value="16px">16</option>
        <option value="18px">18</option>
        <option value="20px">20</option>
        <option value="24px">24</option>
      </select>

      <select
        className={styles.toolSelect}
        title="行距"
        onChange={(e) => {
          if (e.target.value) {
            onBlockStyle({ lineHeight: e.target.value } as Partial<CSSStyleDeclaration>);
            e.target.value = '';
          }
        }}
        defaultValue=""
      >
        <option value="">行距</option>
        <option value="1.5">1.5</option>
        <option value="1.75">1.75</option>
        <option value="2">2</option>
        <option value="2.2">2.2</option>
      </select>

      <input
        type="color"
        className={styles.colorInput}
        title="文字颜色"
        defaultValue="#1d252d"
        onChange={(e) => onInlineStyle({ color: e.target.value } as Partial<CSSStyleDeclaration>)}
      />
      <input
        type="color"
        className={styles.colorInput}
        title="背景颜色"
        defaultValue="#fff7eb"
        onChange={(e) =>
          onInlineStyle({ backgroundColor: e.target.value } as Partial<CSSStyleDeclaration>)
        }
      />

      <button className={styles.iconBtn} onClick={() => onBlockStyle({ textAlign: 'left' } as Partial<CSSStyleDeclaration>)} title="左对齐">
        ≡
      </button>
      <button className={styles.iconBtn} onClick={() => onBlockStyle({ textAlign: 'center' } as Partial<CSSStyleDeclaration>)} title="居中">
        ☰
      </button>
      <button className={styles.iconBtn} onClick={() => onBlockStyle({ textAlign: 'right' } as Partial<CSSStyleDeclaration>)} title="右对齐">
        ≣
      </button>

      <button onClick={onWrapNotice}>提示框</button>
      <button onClick={onClearStyle}>清样式</button>
    </div>
  );
}
