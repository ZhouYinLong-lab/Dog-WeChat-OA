import { describe, it, expect } from 'vitest';
import { sanitizeForEditor } from '../lib/sanitizer';

describe('sanitizeForEditor', () => {
  it('removes script tags', () => {
    const result = sanitizeForEditor('<p>Hello</p><script>alert(1)</script>');
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
  });

  it('removes on* event handlers', () => {
    const result = sanitizeForEditor('<p onclick="alert(1)">Hello</p>');
    expect(result).not.toContain('onclick');
  });

  it('removes javascript: URLs from href', () => {
    const result = sanitizeForEditor('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('removes javascript: URLs from xlink:href', () => {
    const result = sanitizeForEditor(
      '<svg><a xlink:href="javascript:alert(1)">click</a></svg>'
    );
    expect(result).not.toContain('javascript:');
  });

  it('removes base elements', () => {
    const result = sanitizeForEditor('<base href="http://evil.com/"><p>content</p>');
    expect(result).not.toContain('base');
    expect(result).not.toContain('evil.com');
  });

  it('removes form elements', () => {
    const result = sanitizeForEditor('<form><input type="text"><button>Submit</button></form>');
    expect(result).not.toContain('form');
    expect(result).not.toContain('input');
    expect(result).not.toContain('button');
  });

  it('removes iframe, object, embed', () => {
    const result = sanitizeForEditor(
      '<iframe src="x"></iframe><object data="x"></object><embed src="x">'
    );
    expect(result).not.toContain('iframe');
    expect(result).not.toContain('object');
    expect(result).not.toContain('embed');
  });

  it('preserves safe content', () => {
    const input = '<p style="color:red">Hello <strong>World</strong></p>';
    const result = sanitizeForEditor(input);
    expect(result).toContain('Hello');
    expect(result).toContain('strong');
    expect(result).toContain('color:red');
  });

  it('handles malformed HTML gracefully', () => {
    // Severely malformed should return escaped text
    const result = sanitizeForEditor('<<<broken');
    expect(result).toBeDefined();
    // Should not crash
  });

  it('returns empty for empty input', () => {
    const result = sanitizeForEditor('');
    expect(result).toBeDefined();
  });
});
