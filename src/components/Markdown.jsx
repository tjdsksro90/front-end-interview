import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkCjkFriendly from 'remark-cjk-friendly'; // **강조)**은 처럼 한글이 바로 붙어도 굵게 처리
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';
import { categoryByFolder } from '../data/categories.js';
import { highlight } from './kit.jsx';

// md 안의 상대 링크(./other.md, ../react-questions/x.md)를 사이트 경로로 바꾼다
function toRoute(href, folder) {
  const m = href.match(/^(?:\.\/)?(?:\.\.\/([\w-]+-questions)\/)?([^/]+)\.md(#.*)?$/);
  if (!m) return null;
  const category = categoryByFolder(m[1] ?? folder);
  return category ? `/${category.id}/${m[2]}${m[3] ?? ''}` : null;
}

export default function Markdown({ source, folder }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-h1:text-xl prose-h1:font-bold prose-h2:text-lg prose-a:text-indigo-600 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#1e1f24] prose-pre:ring-1 prose-pre:ring-white/10 prose-img:rounded-xl dark:prose-a:text-indigo-400 dark:prose-pre:bg-zinc-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCjkFriendly]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a({ href = '', children, node, ...props }) {
            const route = toRoute(href, folder);
            if (route) return <Link to={route}>{children}</Link>;
            const external = /^https?:/.test(href);
            return <a href={href} {...(external && { target: '_blank', rel: 'noopener noreferrer' })} {...props}>{children}</a>;
          },
          img({ src = '', alt, node, ...props }) {
            // 저장소에 없는 이미지는 깨진 아이콘 대신 대체 텍스트로 보여준다
            return <img src={src} alt={alt} loading="lazy" onError={(e) => e.currentTarget.replaceWith(`[이미지: ${alt || src}]`)} {...props} />;
          },
          code({ className = '', children, node, ...props }) {
            const inline = !className.includes('language-') && !String(children).includes('\n');
            return inline ? (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] font-normal text-indigo-700 dark:bg-zinc-800 dark:text-indigo-300" {...props}>{children}</code>
            ) : (
              <code className={`${className} font-mono text-[13px]`} {...props}>{highlight(String(children).replace(/\n$/, ''))}</code>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
