import { describe, expect, it } from 'vitest';
import { specificity, specificityList } from '../specificity.js';

describe('specificity', () => {
  it.each([
    ['p', [0, 0, 1]],
    ['.a', [0, 1, 0]],
    ['#x', [1, 0, 0]],
    ['ul li a:hover', [0, 1, 3]],
    ["input[type='checkbox']", [0, 1, 1]],
    ['p::before', [0, 0, 2]],
    ['p:before', [0, 0, 2]], // 옛 문법 가상 요소
    ['nav > a + a ~ span', [0, 0, 4]],
    ['*', [0, 0, 0]],
  ])('%s → %j', (sel, value) => {
    expect(specificity(sel)).toEqual(value);
  });

  it(':is() · :not() · :has()는 괄호 안 가장 높은 값', () => {
    expect(specificity(':is(#app, main) p')).toEqual([1, 0, 1]);
    expect(specificity('li:not(:last-child)')).toEqual([0, 1, 1]);
    expect(specificity('a:not(.active, #x)')).toEqual([1, 0, 1]);
    expect(specificity('.card:has(> img, .thumb)')).toEqual([0, 2, 0]);
    expect(specificity(':is(article, aside, footer) :is(h2, h3) a:hover')).toEqual([0, 1, 3]);
  });

  it(':where()는 항상 0', () => {
    expect(specificity(':where(#app, .a.b) p')).toEqual([0, 0, 1]);
    expect(specificity(':where(ul, ol)[role="list"]')).toEqual([0, 1, 0]);
    expect(specificity('a:not(:where(.active, #x))')).toEqual([0, 0, 1]);
  });

  it(':nth-child(... of S)는 S의 값을 더한다', () => {
    expect(specificity('li:nth-child(2 of .item)')).toEqual([0, 2, 1]);
  });

  it('쉼표 목록은 선택자마다 따로 계산한다', () => {
    expect(specificityList('h1, .title, #main').map((s) => s.value)).toEqual([
      [0, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
    ]);
  });

  it('잘못된 선택자는 에러', () => {
    expect(() => specificity(':is(.a')).toThrow();
    expect(() => specificity('.')).toThrow();
  });
});
