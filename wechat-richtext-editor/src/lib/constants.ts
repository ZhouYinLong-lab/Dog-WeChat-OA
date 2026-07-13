import type { EditorState } from './types';

/** Default initial editor state */
export const INITIAL_STATE: EditorState = {
  rawHtml: '',
  importedRawHtml: '',
  currentTab: 'summary',
  history: [],
  redo: [],
  lastProbe: null,
  selectedNodeId: null,
};

/** Max history stack size */
export const MAX_HISTORY = 50;

/** Debounce delay for probe updates (ms) */
export const PROBE_DEBOUNCE_MS = 250;

/** Max outline items */
export const MAX_OUTLINE_ITEMS = 80;

/** Max document nodes sent to LLM */
export const MAX_DOC_NODES = 120;

/** Editor nodes that get data-wxagent-id attributes */
export const TAGABLE_SELECTOR =
  'p, section, blockquote, li, td, th, h1, h2, h3, h4, h5, h6, img, span, strong, em';

/** Nodes counted as "operable" in probe */
export const COUNTABLE_SELECTOR =
  'p, section, blockquote, li, td, th, h1, h2, h3, h4, h5, h6, img';

/** Nodes that form the outline */
export const OUTLINE_SELECTOR = 'p, section, blockquote, li, h1, h2, h3, img';

/** Elements removed by the sanitizer */
export const SANITIZE_REMOVE_SELECTOR =
  'script, iframe, object, embed, link, meta, style, base, form, input, button, textarea, select';

/** Unsafe elements reported by compatibility checker */
export const UNSAFE_ELEMENTS_SELECTOR =
  'script, iframe, object, embed, style, link, meta, base, form, input, button, textarea, select';

/** Unsupported media elements (WeChat specific) */
export const UNSUPPORTED_MEDIA_SELECTOR = 'picture, video, audio, canvas, svg';

/** Default sample HTML */
export const DEFAULT_SAMPLE = `
<section style="margin:0 8px;color:#3f3f3f;font-size:16px;line-height:1.8;">
  <h2 style="margin:0 0 14px;font-size:22px;color:#146c94;text-align:center;">公众号富文本往返测试</h2>
  <p style="margin:0 0 14px;">这是一段从微信公众号编辑器复制出来后，应该尽量保持排版的正文。</p>
  <section style="margin:18px 0;padding:14px 16px;background:#eef8fb;border-left:4px solid #146c94;border-radius:6px;">
    <p style="margin:0;color:#26343d;">重点：未被修改的区域，应在复制回微信后保持视觉效果一致。</p>
  </section>
  <p style="margin:0 0 14px;">你可以选中这段文字，让右侧 Agent 生成节点级操作。</p>
</section>`;

/** Default placeholder shown in the iframe before any content is imported */
export const DEFAULT_IFRAME_HTML =
  '<p style="font-size:16px;line-height:1.8;color:#333;">请先从微信公众号编辑器复制内容并粘贴到左侧探针。</p>';

/** Default LLM system prompt */
export const DEFAULT_SYSTEM_PROMPT = `你是微信公众号富文本 DOM 编辑 Agent。只能返回 JSON，不要返回 Markdown。JSON 格式为 {"operations":[...]}。
允许操作：
1. replace_text: {"type":"replace_text","nodeId":"...","oldText":"...","newText":"..."}
2. set_style: {"type":"set_style","nodeId":"...","styles":{"color":"#146c94","fontWeight":"bold"}}
3. insert_after: {"type":"insert_after","nodeId":"...","html":"<p style=\\"...\\">...</p>"}
4. delete_node: {"type":"delete_node","nodeId":"..."}
原则：只改用户要求的节点；保留未修改区域；不要整篇重写 HTML。`;

/** CSSStyleDeclaration prototype keys that must not be set via set_style */
export const FORBIDDEN_STYLE_KEYS = new Set([
  'cssText',
  'length',
  'parentRule',
  'setProperty',
  'removeProperty',
  'getPropertyValue',
  'getPropertyPriority',
  'item',
]);

/** Iframe document CSS (injected via doc.write) */
export const IFRAME_CSS = `
html, body { margin: 0; padding: 0; background: #fff; }
body {
  min-height: 640px;
  padding: 22px 18px 42px;
  color: rgba(0, 0, 0, 0.9);
  font-size: 17px;
  font-family: "mp-quote", "PingFang SC", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;
  line-height: 1.6;
  letter-spacing: 0.034em;
  text-align: justify;
  text-underline-position: under;
  overflow: hidden;
  outline: none;
  word-break: break-word;
}
body * { max-width: 100% !important; box-sizing: border-box !important; overflow-wrap: break-word !important; }
p { clear: both; min-height: 1em; }
h1, h2, h3, h4, h5, h6 { font-size: 16px; font-weight: 400; }
blockquote { padding-left: 10px; border-left: 3px solid #dbdbdb; color: rgba(0, 0, 0, 0.55); font-size: 15px; margin: 1em 0; line-height: 1.6; }
a { color: #576b95; text-decoration: none; }
td, th { padding: 5px 10px; border: 1px solid #ddd; }
.code-snippet { margin: 10px 0; padding: 1em; color: #333; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 2px; font: 14px/1.6 Consolas, "Liberation Mono", Menlo, Courier, monospace; }
.we-emoji { width: 1em; height: 1em; font-size: 22px; vertical-align: middle; }
[data-wxagent-id] { outline: 0 solid transparent; }
[data-wxagent-id]:hover { outline: 1px dashed rgba(20, 108, 148, 0.35); outline-offset: 2px; }
.wxagent-selected { outline: 2px solid rgba(20, 108, 148, 0.75) !important; outline-offset: 2px; }
img { max-width: 100%; height: auto; }
`;

/** Default Agent form values */
export const DEFAULT_AGENT_CONFIG = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4.1-mini',
  prompt: '把选中的文字改得更简洁，但不要改变原有排版。',
};
