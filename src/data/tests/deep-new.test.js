import { describe, expect, it } from 'vitest';
import { isNew, isNewDeep, sortQuestions, updatedTime } from '../questions.js';

// 심화(deep)에 added가 있으면: 7일 동안 NEW, 최신순에서는 연결된 질문이 그 시각 기준으로 위로 올라온다.

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-19T12:00:00+09:00');
const ago = (days) => new Date(NOW - days * DAY).toISOString();

const oldQ = (deep = []) => ({ slug: 'old', added: '2026-11-03T18:13:35+09:00', deep });
const freshQ = { slug: 'fresh', added: ago(1), deep: [] };

describe('심화 NEW와 최신순', () => {
  it('7일 안에 추가한 심화는 NEW, 그보다 오래됐거나 날짜가 없으면 아니다', () => {
    expect(isNewDeep({ added: ago(2) }, NOW)).toBe(true);
    expect(isNewDeep({ added: ago(8) }, NOW)).toBe(false);
    expect(isNewDeep({}, NOW)).toBe(false);
  });

  it('오래된 질문이라도 새 심화가 붙으면 질문에 NEW가 붙는다', () => {
    expect(isNew(oldQ(), NOW)).toBe(false);
    expect(isNew(oldQ([{ added: ago(8) }]), NOW)).toBe(false);
    expect(isNew(oldQ([{ added: ago(2) }]), NOW)).toBe(true);
  });

  it('업데이트 시각은 질문 등록과 심화 추가 중 가장 최근', () => {
    const q = oldQ([{ added: ago(10) }, { added: ago(3) }]);
    expect(updatedTime(q)).toBe(Date.parse(ago(3)));
  });

  it('최신순: 새 심화가 붙은 예전 질문이 위로, 등록순은 그대로', () => {
    const updated = { ...oldQ([{ added: ago(0.5) }]), slug: 'updated' };
    const list = [oldQ(), updated, freshQ];
    expect(sortQuestions(list, 'new').map((q) => q.slug)).toEqual(['updated', 'fresh', 'old']);
    expect(sortQuestions(list, 'old')).toBe(list);
  });
});
