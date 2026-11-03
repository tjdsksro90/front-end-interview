import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchInput, { useQueryParam } from '../SearchInput.jsx';

const PLACEHOLDER = '질문 검색';
const LAG = 30;

// 실제 페이지(Home, CategoryPage)와 같은 구조: 검색어를 URL ?q=에 저장
function UrlHarness() {
  const [q, setQ] = useQueryParam();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <SearchInput value={q} onChange={setQ} placeholder={PLACEHOLDER} />
      <output data-testid="url">{location.search}</output>
      <button onClick={() => navigate('/?q=react')}>뒤로 가기 흉내</button>
    </>
  );
}

// 라우터가 URL을 transition으로 늦게 반영하는 상황을 재현: 부모의 value가 LAG ms 늦게 따라온다
function LaggingHarness() {
  const [value, setValue] = useState('');
  return <SearchInput value={value} onChange={(v) => setTimeout(() => setValue(v), LAG)} placeholder={PLACEHOLDER} />;
}

const input = () => screen.getByPlaceholderText(PLACEHOLDER);

// 한글 IME 입력 흉내: compositionstart → 조합 중 input 이벤트들 → compositionend
function typeKorean(el, steps) {
  fireEvent.compositionStart(el);
  for (const v of steps) fireEvent.change(el, { target: { value: v } });
  fireEvent.compositionEnd(el, { target: { value: steps.at(-1) } });
}

// 한 글자씩 지우기. 키 입력 사이에 interval ms가 흐르게 해서, 늦게 따라오는 값이 지우는 도중에 도착하게 한다
function backspaceAll(el, interval = 0) {
  for (let v = el.value; v.length > 0; ) {
    v = v.slice(0, -1);
    fireEvent.change(el, { target: { value: v } });
    expect(el.value).toBe(v);
    if (interval) act(() => vi.advanceTimersByTime(interval));
  }
}

describe('SearchInput', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('입력한 글자가 부모 value를 기다리지 않고 바로 input에 남는다 (조합 중 되돌아가지 않음)', () => {
    render(<MemoryRouter><LaggingHarness /></MemoryRouter>);
    const el = input();
    fireEvent.compositionStart(el);
    for (const v of ['ㄱ', '가', '간']) {
      fireEvent.change(el, { target: { value: v } });
      expect(el.value).toBe(v); // 부모 value('')로 되돌아가면 한글 조합이 깨진다
    }
    fireEvent.compositionEnd(el, { target: { value: '간' } });
    act(() => vi.advanceTimersByTime(LAG * 2));
    expect(el.value).toBe('간');
  });

  it('빠르게 다 지웠을 때, 늦게 도착한 이전 값이 input을 되살리지 않는다', () => {
    render(<MemoryRouter><LaggingHarness /></MemoryRouter>);
    const el = input();
    typeKorean(el, ['ㄹ', '리', '릭', '리애', '리액', '리액ㅌ', '리액트']);
    act(() => vi.advanceTimersByTime(LAG * 2));
    expect(el.value).toBe('리액트');

    backspaceAll(el, LAG / 2);
    expect(el.value).toBe('');
    // 지운 뒤 늦게 도착하는 '리액', '리' 같은 값들이 하나씩 반영되는 동안에도 비어 있어야 한다
    for (let t = 0; t < LAG * 2; t += 5) {
      act(() => vi.advanceTimersByTime(5));
      expect(el.value).toBe('');
    }
    expect(el.placeholder).toBe(PLACEHOLDER);
  });

  it('다 지우면 URL의 ?q=가 사라지고 placeholder가 보이는 빈 상태가 된다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <UrlHarness />
      </MemoryRouter>
    );
    const el = input();
    typeKorean(el, ['ㅋ', '클', '클ㄹ', '클로', '클로ㅈ', '클로저']);
    act(() => vi.runAllTimers());
    expect(screen.getByTestId('url').textContent).toBe(`?q=${encodeURIComponent('클로저')}`);

    backspaceAll(el);
    act(() => vi.runAllTimers());
    expect(el.value).toBe('');
    expect(el.placeholder).toBe(PLACEHOLDER);
    expect(screen.getByTestId('url').textContent).toBe('');
  });

  it('지우기(X) 버튼은 input과 URL을 함께 비운다', () => {
    render(
      <MemoryRouter initialEntries={['/?q=useMemo']}>
        <UrlHarness />
      </MemoryRouter>
    );
    const el = input();
    expect(el.value).toBe('useMemo');
    fireEvent.click(screen.getByLabelText('검색어 지우기'));
    act(() => vi.runAllTimers());
    expect(el.value).toBe('');
    expect(screen.getByTestId('url').textContent).toBe('');
  });

  it('조합 중에 X 버튼을 누르면(조합 확정 → 지우기 순서) 마지막엔 비어 있다', () => {
    render(<MemoryRouter><LaggingHarness /></MemoryRouter>);
    const el = input();
    fireEvent.compositionStart(el);
    fireEvent.change(el, { target: { value: '가' } });
    // 버튼을 누르면 input이 포커스를 잃으면서 조합이 확정된 뒤 click이 온다
    fireEvent.compositionEnd(el, { target: { value: '가' } });
    fireEvent.click(screen.getByLabelText('검색어 지우기'));
    act(() => vi.advanceTimersByTime(LAG * 2));
    expect(el.value).toBe('');
  });

  it('뒤로 가기처럼 바깥에서 URL이 바뀌면 input도 그 값으로 바뀐다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <UrlHarness />
      </MemoryRouter>
    );
    const el = input();
    fireEvent.change(el, { target: { value: 'vue' } });
    act(() => vi.runAllTimers());
    fireEvent.click(screen.getByText('뒤로 가기 흉내'));
    act(() => vi.runAllTimers());
    expect(el.value).toBe('react');
  });
});
