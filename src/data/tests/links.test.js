import { describe, expect, it } from 'vitest';
import { extractTargets, resolveLink, wikiToMarkdown } from '../links.js';

const entries = [
  { folder: 'web-questions', slug: 'docker' },
  { folder: 'web-questions', slug: 'cors' },
  { folder: 'react-questions', slug: 'hooks' },
  { folder: 'react-questions', slug: 'component' },
  { folder: 'javascript-questions', slug: 'component' }, // 같은 이름이 두 폴더에 있음
];

describe('wikiToMarkdown', () => {
  it('[[이름]]을 md 링크로 바꾼다', () => {
    expect(wikiToMarkdown('참고: [[docker]]')).toBe('참고: [docker](docker.md)');
  });

  it('별칭과 제목(#)을 유지한다', () => {
    expect(wikiToMarkdown('[[cors#preflight|사전 요청]]')).toBe('[사전 요청](cors.md#preflight)');
  });

  it('폴더가 있으면 표시 이름은 파일 이름만 쓴다', () => {
    expect(wikiToMarkdown('[[react-questions/hooks]]')).toBe('[hooks](react-questions/hooks.md)');
  });

  it('이미지 임베드와 코드 안의 [[...]]는 그대로 둔다', () => {
    const md = '![[diagram.png]]\n`[[docker]]`\n```\n[[cors]]\n```';
    expect(wikiToMarkdown(md)).toBe(md);
  });
});

describe('extractTargets', () => {
  it('위키 링크와 일반 md 링크를 모두 뽑는다', () => {
    const md = '[[docker]] 와 [CORS](./cors.md#a), [훅](../react-questions/hooks.md), [외부](https://a.com)';
    expect(extractTargets(md)).toEqual(['docker', './cors.md', '../react-questions/hooks.md']);
  });

  it('코드 블록 안의 링크는 무시한다', () => {
    expect(extractTargets('```md\n[[docker]] [x](a.md)\n```')).toEqual([]);
  });
});

describe('resolveLink', () => {
  it('같은 폴더의 상대 링크', () => {
    expect(resolveLink('./cors.md', 'web-questions', entries)).toEqual(entries[1]);
  });

  it('다른 폴더를 적은 링크', () => {
    expect(resolveLink('../react-questions/hooks.md', 'web-questions', entries)).toEqual(entries[2]);
    expect(resolveLink('react-questions/hooks', 'web-questions', entries)).toEqual(entries[2]);
  });

  it('폴더 없이 이름만 쓰면 전체에서 하나뿐인 파일을 찾는다 (Obsidian 가장 짧은 경로)', () => {
    expect(resolveLink('hooks', 'web-questions', entries)).toEqual(entries[2]);
  });

  it('이름이 여러 폴더에 있으면 같은 폴더를 먼저, 아니면 찾지 않는다', () => {
    expect(resolveLink('component', 'javascript-questions', entries)).toEqual(entries[4]);
    expect(resolveLink('component', 'web-questions', entries)).toBeNull();
  });

  it('없는 파일·외부 주소는 null', () => {
    expect(resolveLink('nope.md', 'web-questions', entries)).toBeNull();
    expect(resolveLink('https://a.com/x.md', 'web-questions', entries)).toBeNull();
  });
});
