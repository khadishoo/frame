import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

// Внешние ссылки — в новой вкладке и без доступа к нашей странице (window.opener)
const components = {
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" {...props}>
      {children}
    </a>
  ),
};

/**
 * Markdown → React-элементы. Без dangerouslySetInnerHTML: react-markdown строит дерево
 * сам, а сырой HTML из текста (<script>, onerror=…) rehype-sanitize вырезает.
 * remark-gfm — таблицы, зачёркивание, списки задач «- [ ]».
 */
export function MarkdownView({ children, className }) {
  return (
    <div className={cn('markdown', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
