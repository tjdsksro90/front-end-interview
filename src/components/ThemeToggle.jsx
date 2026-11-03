// nextjs-portfolio의 ThemeToggle을 next-themes 없이 옮긴 버전.
// <html>의 dark 클래스를 토글하고 localStorage에 저장한다. (초기값은 index.html 스크립트가 적용)
export default function ThemeToggle() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // 저장이 막힌 환경이면 이번 방문 동안만 적용된다
    }
  };

  return (
    <button
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:h-9 sm:w-9 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-yellow-300"
      type="button"
      aria-label="테마 변경"
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="visible absolute top-1/2 left-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 dark:invisible">
        <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor" className="invisible absolute top-1/2 left-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 dark:visible">
        <path
          fillRule="evenodd"
          d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
