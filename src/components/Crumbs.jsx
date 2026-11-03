import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export default function Crumbs({ items }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span>/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-indigo-600 dark:hover:text-indigo-400">{item.label}</Link>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
