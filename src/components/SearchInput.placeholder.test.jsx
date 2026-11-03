import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchInput from './SearchInput.jsx';
import Home from '../pages/Home.jsx';
import CategoryPage from '../pages/CategoryPage.jsx';
import { categories } from '../data/categories.js';

// placeholder 자리에 "null"(또는 "undefined")이 보이는 경우를 찾기 위한 테스트.
// 실제 페이지(홈, 모든 카테고리)를 렌더해서 입력 → 삭제 → 페이지 이동 후에도 placeholder가 정상인지 본다.

const BAD = /null|undefined|NaN|\[object/;

function Pages() {
  const navigate = useNavigate();
  return (
    <>
      <Routes>
        <Route index element={<Home />} />
        <Route path=":categoryId" element={<CategoryPage />} />
      </Routes>
      {categories.map((c) => (
        <button key={c.id} onClick={() => navigate(`/${c.id}`)}>{`go-${c.id}`}</button>
      ))}
      <button onClick={() => navigate('/')}>go-home</button>
    </>
  );
}

const searchBox = () => screen.getByRole('searchbox');
const expectPlaceholder = (expected) => {
  const el = searchBox();
  expect(el.getAttribute('placeholder')).toBe(expected);
  expect(el.getAttribute('placeholder')).not.toMatch(BAD);
  expect(el.value).toBe('');
};

const PAGES = [
  ['/', '카테고리 또는 질문 검색 (예: 클로저, useMemo, 박스 모델)'],
  ...categories.map((c) => [`/${c.id}`, `${c.title} 질문 검색`]),
];

describe('검색창 placeholder', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each(PAGES)('%s 처음 들어왔을 때 placeholder가 정상', (path, expected) => {
    render(<MemoryRouter initialEntries={[path]}><Pages /></MemoryRouter>);
    expectPlaceholder(expected);
  });

  it.each(PAGES)('%s 한글 입력 → 한 글자씩 삭제 후에도 placeholder가 정상', (path, expected) => {
    render(<MemoryRouter initialEntries={[path]}><Pages /></MemoryRouter>);
    const el = searchBox();
    fireEvent.compositionStart(el);
    for (const v of ['ㄹ', '리', '리ㅇ', '리애', '리액']) fireEvent.change(el, { target: { value: v } });
    fireEvent.compositionEnd(el, { target: { value: '리액' } });
    for (const v of ['리', '']) fireEvent.change(el, { target: { value: v } });
    act(() => vi.runAllTimers());
    expectPlaceholder(expected);
  });

  it.each(PAGES)('%s 검색어를 X 버튼으로 지운 뒤 placeholder가 정상', (path, expected) => {
    render(<MemoryRouter initialEntries={[`${path}?q=react`]}><Pages /></MemoryRouter>);
    fireEvent.click(screen.getByLabelText('검색어 지우기'));
    act(() => vi.runAllTimers());
    expectPlaceholder(expected);
  });

  it('검색 중에 다른 카테고리로 이동하면 그 카테고리의 placeholder가 보인다', () => {
    render(<MemoryRouter initialEntries={['/react']}><Pages /></MemoryRouter>);
    fireEvent.change(searchBox(), { target: { value: 'memo' } });
    act(() => vi.runAllTimers());
    for (const c of categories) {
      fireEvent.click(screen.getByText(`go-${c.id}`));
      act(() => vi.runAllTimers());
      expectPlaceholder(`${c.title} 질문 검색`);
    }
    fireEvent.click(screen.getByText('go-home'));
    act(() => vi.runAllTimers());
    expectPlaceholder(PAGES[0][1]);
  });

  it.each([null, undefined, ''])('placeholder로 %s가 넘어와도 "null"·"undefined" 글자가 보이지 않는다', (placeholder) => {
    render(<MemoryRouter><SearchInput value="" onChange={() => {}} placeholder={placeholder} /></MemoryRouter>);
    expect(searchBox().getAttribute('placeholder') ?? '').not.toMatch(BAD);
  });
});
