/**
 * useClipboard — read/write clipboard with HTML + plain text.
 */
import { useCallback } from 'react';
import type { AgentStatusType } from '../lib/types';

export function useClipboard(setStatus: (msg: string, type: AgentStatusType) => void) {
  /** Copy HTML + plain text to clipboard (Async Clipboard API with fallback) */
  const copyWechatContent = useCallback(
    async (html: string, plain: string) => {
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([plain], { type: 'text/plain' }),
            }),
          ]);
        } else {
          throw new Error('ClipboardItem unavailable');
        }
        setStatus('已写入富文本剪贴板。现在可以到公众号编辑器 Ctrl+V。', 'good');
      } catch {
        // Fallback: use deprecated execCommand('copy')
        const helper = document.createElement('div');
        helper.contentEditable = 'true';
        helper.style.cssText = 'position:fixed;left:-9999px;';
        helper.innerHTML = html;
        document.body.appendChild(helper);
        const range = document.createRange();
        range.selectNodeContents(helper);
        const selection = window.getSelection();
        selection!.removeAllRanges();
        selection!.addRange(range);
        document.execCommand('copy');
        helper.remove();
        selection!.removeAllRanges();
        setStatus('已使用兼容模式复制。若浏览器拦截，请通过 HTTPS 或 localhost 打开。', 'warn');
      }
    },
    [setStatus]
  );

  /** Read HTML + plain text from a paste event */
  const readClipboard = useCallback((event: ClipboardEvent) => {
    const data = event.clipboardData;
    if (!data) return { types: [] as string[], html: '', plain: '' };
    const types = [...data.types];
    const html = data.getData('text/html');
    const plain = data.getData('text/plain');
    return { types, html, plain };
  }, []);

  /** Download HTML as file */
  const downloadHtml = useCallback((html: string) => {
    const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><title>wechat-export</title></head><body>${html}</body></html>`;
    const url = URL.createObjectURL(
      new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wechat-export.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, []);

  return { copyWechatContent, readClipboard, downloadHtml };
}
