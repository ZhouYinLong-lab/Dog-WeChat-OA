import { describe, it, expect } from 'vitest';
import { analyzeHtml } from '../lib/analyzer';

describe('analyzeHtml', () => {
  it('counts tags correctly', () => {
    const result = analyzeHtml('<p>A</p><p>B</p><strong>C</strong>');
    expect(result.tags['p']).toBe(2);
    expect(result.tags['strong']).toBe(1);
  });

  it('counts style properties', () => {
    const result = analyzeHtml('<p style="color:red;font-size:16px">text</p>');
    expect(result.styles['color']).toBe(1);
    expect(result.styles['font-size']).toBe(1);
  });

  it('detects images', () => {
    const result = analyzeHtml('<img src="https://example.com/a.png"><img data-src="b.jpg">');
    expect(result.images).toHaveLength(2);
    expect(result.images[0]).toBe('https://example.com/a.png');
  });

  it('counts operable nodes', () => {
    const result = analyzeHtml('<p>A</p><section>B</section><blockquote>C</blockquote>');
    expect(result.nodeCount).toBe(3);
  });

  it('builds outline', () => {
    const result = analyzeHtml('<p>Hello World</p><h2>Title</h2>');
    expect(result.outline).toHaveLength(2);
    expect(result.outline[0].text).toContain('Hello World');
    expect(result.outline[1].tag).toBe('h2');
  });

  it('truncates outline text', () => {
    const longText = 'A'.repeat(200);
    const result = analyzeHtml(`<p>${longText}</p>`);
    expect(result.outline[0].text.length).toBeLessThanOrEqual(120);
  });

  it('handles empty input', () => {
    const result = analyzeHtml('');
    expect(result.tags).toEqual({});
    expect(result.nodeCount).toBe(0);
  });

  it('handles malformed HTML gracefully', () => {
    const result = analyzeHtml('<<<broken');
    expect(result.nodeCount).toBe(0);
    expect(result.tags).toEqual({});
  });

  it('returns correct htmlLength', () => {
    const html = '<p>test</p>';
    const result = analyzeHtml(html);
    expect(result.htmlLength).toBe(html.length);
  });
});
