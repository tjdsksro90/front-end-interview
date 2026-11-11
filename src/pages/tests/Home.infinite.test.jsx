import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Home from '../Home.jsx';
import { questions } from '../../data/questions.js';

// 홈: 검색 전에는 전체 질문을 10개씩, 목록 끝이 보이면 10개씩 더. 검색하면 검색 결과만.

let observers = [];
class FakeIO {
  constructor(cb) { this.cb = cb; observers.push(this); }
  observe(el) { this.el = el; }
  disconnect() { observers = observers.filter((o) => o !== this); }
}
// 지금 살아 있는 observer에 "끝이 화면에 들어왔다"를 알린다
const reachEnd = () => act(() => observers.forEach((o) => o.cb([{ isIntersecting: true, target: o.el }])));

const cards = () => document.querySelectorAll('.group.relative').length;

describe('홈 전체 질문 무한 스크롤', () => {
  beforeEach(() => { observers = []; globalThis.IntersectionObserver = FakeIO; sessionStorage.clear(); });
  afterEach(() => { cleanup(); delete globalThis.IntersectionObserver; });

  it('처음에는 10개만 보인다', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(cards()).toBe(10);
    expect(screen.getByText(`더 보기 (10 / ${questions.length})`)).toBeTruthy();
  });

  it('목록 끝에 닿을 때마다 10개씩 늘고, 끝까지 가면 멈춘다', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    reachEnd();
    expect(cards()).toBe(20);
    reachEnd();
    expect(cards()).toBe(30);
    for (let i = 0; i < questions.length; i++) reachEnd();
    expect(cards()).toBe(questions.length);
    expect(screen.getByText('모든 질문을 다 봤어요.')).toBeTruthy();
    expect(observers.length).toBe(0);
  });

  it('최신 등록순이다', () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    const time = (q) => (q.added ? Date.parse(q.added) : 0);
    const newest = [...questions].sort((a, b) => time(b) - time(a))[0];
    expect(document.querySelector('.group.relative a').textContent).toBe(newest.title);
  });

  it('검색어가 있으면 전체 목록 대신 검색 결과만 보인다', () => {
    render(<MemoryRouter initialEntries={['/?q=hydration']}><Home /></MemoryRouter>);
    expect(screen.queryByText(/^전체 질문/)).toBeNull();
    expect(screen.getByText(/질문 검색 결과/)).toBeTruthy();
  });

  it('뒤로 가기로 같은 방문 기록에 돌아오면 불러왔던 개수를 그대로 다시 그린다', () => {
    const entry = { pathname: '/', key: 'visit-1' };
    const first = render(<MemoryRouter initialEntries={[entry]}><Home /></MemoryRouter>);
    reachEnd();
    reachEnd();
    expect(cards()).toBe(30);
    first.unmount(); // 질문 페이지로 이동

    render(<MemoryRouter initialEntries={[entry]}><Home /></MemoryRouter>); // 같은 key로 복귀
    expect(cards()).toBe(30);
  });

  it('링크로 새로 들어온 홈(새 방문 기록)은 10개부터 시작한다', () => {
    const first = render(<MemoryRouter initialEntries={[{ pathname: '/', key: 'visit-1' }]}><Home /></MemoryRouter>);
    reachEnd();
    expect(cards()).toBe(20);
    first.unmount();

    render(<MemoryRouter initialEntries={[{ pathname: '/', key: 'visit-2' }]}><Home /></MemoryRouter>);
    expect(cards()).toBe(10);
  });
});
