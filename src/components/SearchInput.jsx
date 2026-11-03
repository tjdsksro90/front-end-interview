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

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative mt-6 mb-2">
      <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-400">
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pr-12 pl-12 text-base text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-zinc-100 text-xs text-zinc-500 hover:text-zinc-900 dark:bg-zinc-800 dark:hover:text-zinc-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}
