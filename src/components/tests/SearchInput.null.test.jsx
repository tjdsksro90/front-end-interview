import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchInput, { useQueryParam } from '../SearchInput.jsx';
import { matches } from '../../data/search.js';

// 검색창이 비었는데 placeholder 대신 아무것도 안 보이거나 "null"이 보이는 경우를 찾기 위한 테스트.
// null(또는 undefined)이 검색창까지 흘러 들어올 수 있는 길을 하나씩 막아 본다.

const PLACEHOLDER = '질문 검색';
const input = () => screen.getByPlaceholderText(PLACEHOLDER);
const url = () => screen.getByTestId('url').textContent;

// 부모가 value를 마음대로 바꿀 수 있는 하네스 (null·undefined를 직접 넣어 본다)
function ControlledHarness({ initial }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <SearchInput value={value} onChange={setValue} placeholder={PLACEHOLDER} />
      <button onClick={() => setValue(null)}>null로</button>
      <button onClick={() => setValue(undefined)}>undefined로</button>
    </>
  );
}

// 실제 페이지와 같은 구조. setQ에 아무 값이나 넣어 볼 수 있고, 다른 URL로 이동(뒤로 가기 흉내)도 할 수 있다
function UrlHarness({ debounce = 0 }) {
  const [q, setQ] = useQueryParam();
  const location = useLocation();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(null);
  // debounce: 라우터가 중간 URL을 건너뛰고 마지막 값만 반영하는 상황 흉내
  const onChange = debounce
    ? (v) => {
        clearTimeout(timer);
        setTimer(setTimeout(() => setQ(v), debounce));
      }
    : setQ;
  return (
    <>
      <SearchInput value={q} onChange={onChange} placeholder={PLACEHOLDER} />
      <output data-testid="url">{location.search}</output>
      <button onClick={() => setQ(null)}>setQ(null)</button>
      <button onClick={() => setQ(undefined)}>setQ(undefined)</button>
      <button onClick={() => navigate('/?q=a')}>?q=a로 이동</button>
      <button onClick={() => navigate('/')}>검색어 없는 URL로 이동</button>
    </>
  );
}

const inRouter = (ui, entry = '/') => render(<MemoryRouter initialEntries={[entry]}>{ui}</MemoryRouter>);

describe('검색창에 null이 들어오는 경우', () => {
  let consoleError;
  beforeEach(() => {
    vi.useFakeTimers();
    // React는 input에 value={null}이 들어가면 경고를 console.error로 낸다 → 경고가 나면 실패로 본다
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    consoleError.mockRestore();
  });

  const expectEmptyWithPlaceholder = (el) => {
    expect(el.value).toBe('');
    expect(el.value).not.toBe('null');
    expect(el.placeholder).toBe(PLACEHOLDER);
  };
  const expectNoReactWarning = () => expect(consoleError).not.toHaveBeenCalled();

  describe('부모가 value로 null·undefined를 넘길 때', () => {
    it('처음부터 value={null}이어도 빈 칸 + placeholder, React 경고 없음', () => {
      inRouter(<ControlledHarness initial={null} />);
      expectEmptyWithPlaceholder(input());
      expectNoReactWarning();
    });

    it('처음부터 value={undefined}여도 빈 칸 + placeholder, 입력해도 제어/비제어 전환 경고 없음', () => {
      inRouter(<ControlledHarness initial={undefined} />);
      expectEmptyWithPlaceholder(input());
      fireEvent.change(input(), { target: { value: 'react' } });
      expect(input().value).toBe('react');
      expectNoReactWarning();
    });

    it('입력해 둔 상태에서 value가 null로 바뀌면 이전 글자가 남지 않고 비워진다', () => {
      inRouter(<ControlledHarness initial="" />);
      fireEvent.change(input(), { target: { value: 'react' } });
      fireEvent.click(screen.getByText('null로'));
      expectEmptyWithPlaceholder(input());
      expectNoReactWarning();
    });

    it('입력해 둔 상태에서 value가 undefined로 바뀌어도 비워진다', () => {
      inRouter(<ControlledHarness initial="" />);
      fireEvent.change(input(), { target: { value: 'react' } });
      fireEvent.click(screen.getByText('undefined로'));
      expectEmptyWithPlaceholder(input());
      expectNoReactWarning();
    });
  });

  describe('URL(?q=)에서 null이 생길 수 있는 경우', () => {
    it.each([
      ['?q 없음', '/'],
      ['?q=만 있음', '/?q='],
      ['?q (= 없음)', '/?q'],
    ])('%s → 빈 칸 + placeholder', (_, entry) => {
      inRouter(<UrlHarness />, entry);
      expectEmptyWithPlaceholder(input());
    });

    it('setQ(null)은 URL에 "?q=null"을 만들지 않고 q를 지운다', () => {
      inRouter(<UrlHarness />, '/?q=react');
      fireEvent.click(screen.getByText('setQ(null)'));
      act(() => vi.runAllTimers());
      expect(url()).toBe('');
      expectEmptyWithPlaceholder(input());
    });

    it('setQ(undefined)도 마찬가지로 q를 지운다', () => {
      inRouter(<UrlHarness />, '/?q=react');
      fireEvent.click(screen.getByText('setQ(undefined)'));
      act(() => vi.runAllTimers());
      expect(url()).toBe('');
      expectEmptyWithPlaceholder(input());
    });

    it('"null"이 보이는 건 URL에 글자 그대로 ?q=null이 있을 때뿐이다 (사용자가 null을 검색한 경우)', () => {
      inRouter(<UrlHarness />, '/?q=null');
      expect(input().value).toBe('null');
    });
  });

  describe('URL이 늦게·건너뛰며 반영될 때', () => {
    it('중간 URL이 건너뛰어진 뒤 다른 URL로 이동하면, 입력칸이 그 URL 값을 따른다', () => {
      inRouter(<UrlHarness debounce={30} />);
      const el = input();
      // a → ab → a → ab 를 빠르게 입력: URL에는 마지막 ab만 반영된다
      for (const v of ['a', 'ab', 'a', 'ab']) fireEvent.change(el, { target: { value: v } });
      act(() => vi.runAllTimers());
      expect(url()).toBe('?q=ab');
      // 뒤로 가기처럼 ?q=a로 이동 → 입력칸도 a여야 한다 (이전에 보냈던 값 'a'와 헷갈리면 ab로 남는다)
      fireEvent.click(screen.getByText('?q=a로 이동'));
      act(() => vi.runAllTimers());
      expect(el.value).toBe('a');
    });

    it('검색 중에 검색어 없는 URL로 이동하면 빈 칸 + placeholder', () => {
      inRouter(<UrlHarness debounce={30} />);
      const el = input();
      fireEvent.change(el, { target: { value: '클로저' } });
      act(() => vi.runAllTimers());
      fireEvent.click(screen.getByText('검색어 없는 URL로 이동'));
      act(() => vi.runAllTimers());
      expectEmptyWithPlaceholder(el);
    });
  });

  describe('검색 함수(matches)에 null이 들어올 때', () => {
    it.each([null, undefined, ''])('검색어가 %s이면 에러 없이 전체가 매칭된다', (q) => {
      expect(() => matches('React Compiler', q)).not.toThrow();
      expect(matches('React Compiler', q)).toBe(true);
    });

    it('검색 대상 글이 null이어도 에러가 나지 않는다', () => {
      expect(() => matches(null, 'react')).not.toThrow();
      expect(matches(null, 'react')).toBe(false);
    });
  });
});
