import type { TabType, ProbeResult, CompatIssue } from '../../lib/types';

interface ProbeOutputProps {
  tab: TabType;
  probe: ProbeResult | null;
  rawHtml: string;
  compatIssues: CompatIssue[];
  getExportHtml: () => string;
}

export function ProbeOutput({
  tab,
  probe,
  rawHtml,
  compatIssues,
  getExportHtml,
}: ProbeOutputProps) {
  let content: string;

  if (!probe) {
    content = '等待粘贴公众号内容...';
  } else if (tab === 'html') {
    content = rawHtml || getExportHtml() || '无 HTML';
  } else if (tab === 'outline') {
    content = JSON.stringify(probe.outline, null, 2);
  } else if (tab === 'compatibility') {
    content = JSON.stringify(compatIssues, null, 2);
  } else {
    content = JSON.stringify(
      {
        htmlLength: probe.htmlLength,
        textLength: probe.textLength,
        tags: probe.tags,
        styles: probe.styles,
        images: probe.images,
      },
      null,
      2
    );
  }

  return <pre>{content}</pre>;
}
