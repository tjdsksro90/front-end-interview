import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// 검색어·필터를 URL(?q=, ?deep=)에 저장한다.
// 질문에 들어갔다가 뒤로 오면 유지되고, 다른 카테고리로 이동하면 새 URL이라 초기화된다.
export function useQueryParam(name = 'q') {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? '';
  const setValue = (next) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next) p.set(name, next);
        else p.delete(name);
        return p;
      },
      { replace: true }
    );
  return [value, setValue];
}

// URL 갱신은 라우터가 transition으로 늦게 반영하기 때문에, input에 URL 값을 바로 물리면
// 한글 조합 중에 이전 값으로 되돌아가며 글자가 반복 입력되고, 다 지운 뒤 이전 글자가 되살아난다.
// 그래서 input은 자기 state로 즉시 그리고, URL(검색 결과)은 그 값을 따라가게 한다. (SearchInput.test.jsx)
export default function SearchInput({ value, onChange, placeholder }) {
  const [text, setText] = useState(value);
  // 보냈지만 아직 URL에 반영되지 않은 값들. 늦게 도착하는 '리액', '리' 같은 중간값을 바깥 변경으로 착각하지 않게 한다
  const pending = useRef([]);

  useEffect(() => {
    const i = pending.current.indexOf(value);
    if (i !== -1) {
      pending.current = pending.current.slice(i + 1); // 내가 보낸 값이 돌아온 것 → 무시
      return;
    }
    pending.current = [];
    setText(value); // 뒤로 가기처럼 바깥에서 바뀐 경우만 맞춘다
  }, [value]);

  const change = (next) => {
    if (next === text) return; // compositionend가 같은 값을 한 번 더 보내는 경우
    pending.current.push(next);
    setText(next);
    onChange(next);
  };

  return (
    <div className="relative mt-6 mb-2">
      <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-400">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
      </svg>
      <input
        type="search"
        value={text}
        onChange={(e) => change(e.target.value)}
        onCompositionEnd={(e) => change(e.currentTarget.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pr-12 pl-12 text-base text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {text && (
        <button
          onClick={() => change('')}
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-zinc-100 text-xs text-zinc-500 hover:text-zinc-900 dark:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
        </button>
      )}
    </div>
  );
}
