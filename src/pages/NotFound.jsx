import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">페이지를 찾을 수 없어요</h1>
      <Link to="/" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400">홈으로 →</Link>
    </section>
  );
}
