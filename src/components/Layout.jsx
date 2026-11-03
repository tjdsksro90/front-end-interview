import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { categories } from '../data/categories.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/75 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/75">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 md:px-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="홈">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white transition-colors group-hover:bg-indigo-600 dark:bg-zinc-50 dark:text-zinc-900 dark:group-hover:bg-indigo-400">
              FE
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-zinc-900 sm:inline dark:text-zinc-50">
              프론트엔드 면접 질문
            </span>
          </Link>
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <nav aria-label="카테고리" className="hidden items-center md:flex gap-0.5 text-[13px] sm:gap-1 sm:text-sm">
              {categories.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/${c.id}`}
                  className={({ isActive }) =>
                    `inline-flex min-h-[44px] items-center rounded-full px-3 font-medium whitespace-nowrap sm:min-h-0 sm:py-1.5 ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`
                  }
                >
                  {c.title}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-24 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
