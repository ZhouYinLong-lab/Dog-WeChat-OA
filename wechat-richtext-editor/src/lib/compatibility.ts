/**
 * WeChat Official Account compatibility checker.
 * Validates HTML against known WeChat paste/editor constraints.
 */
import type { CompatIssue } from './types';
import {
  UNSAFE_ELEMENTS_SELECTOR,
  UNSUPPORTED_MEDIA_SELECTOR,
} from './constants';

export function validateWechatCompatibility(html: string): CompatIssue[] {
  const parsed = new DOMParser().parseFromString(html || '', 'text/html');
  const issues: CompatIssue[] = [];

  const add = (level: CompatIssue['level'], code: string, message: string, count = 1) =>
    issues.push({ level, code, count, message });

  const count = (selector: string) => parsed.body.querySelectorAll(selector).length;

  // Unsafe elements
  const unsafeCount = count(UNSAFE_ELEMENTS_SELECTOR);
  if (unsafeCount)
    add('error', 'unsafe-elements', '包含微信会移除或拒绝的元素。', unsafeCount);

  // Unsupported media
  const unsupportedCount = count(UNSUPPORTED_MEDIA_SELECTOR);
  if (unsupportedCount)
    add('error', 'unsupported-media', '请改用 img 或通过公众号后台插入对应媒体。', unsupportedCount);

  // div normalization
  const divCount = count('div');
  if (divCount)
    add('warn', 'div-normalization', '微信可能把 div 转为 p，复杂布局可能改变。', divCount);

  // WeChat plugin cards
  const pluginCount = count(
    "section.js_plugin_card, [data-type='video'], [data-type='audio'], [data-type='vote'], [data-type='weapp']"
  );
  if (pluginCount)
    add(
      'warn',
      'wechat-plugin-card',
      '微信特有卡片通常不能靠跨编辑器剪贴板无损往返。',
      pluginCount
    );

  // Image checks
  const allImages = [...parsed.body.querySelectorAll('img')];

  // Background URLs
  const backgroundUrls = [...parsed.body.querySelectorAll('[style]')].filter((node) =>
    /background(?:-image)?\s*:[^;]*url\s*\(/i.test(
      (node as HTMLElement).getAttribute('style') || ''
    )
  );
  if (backgroundUrls.length)
    add(
      'warn',
      'background-url',
      '微信粘贴预处理可能移除 background-image URL。',
      backgroundUrls.length
    );

  // Local images
  const localImages = allImages.filter((img) =>
    /^(?:file:|blob:|data:)/i.test(
      img.getAttribute('src') || img.getAttribute('data-src') || ''
    )
  );
  if (localImages.length)
    add('error', 'local-image', '本地、Blob 或 Data URL 图片需先上传。', localImages.length);

  // External images (non-WeChat CDN)
  const externalImages = allImages.filter((img) => {
    const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
    return /^https?:/i.test(src) && !/\.qpic\.cn|mmbiz\.qlogo\.cn/i.test(src);
  });
  if (externalImages.length)
    add(
      'warn',
      'external-image',
      '非微信 CDN 图片是否保留取决于公众号粘贴与图片上传策略。',
      externalImages.length
    );

  if (!issues.length)
    add(
      'pass',
      'basic-html',
      '未发现静态检查可识别的微信粘贴风险。仍需在真实公众号后台完成往返测试。',
      0
    );

  return issues;
}
