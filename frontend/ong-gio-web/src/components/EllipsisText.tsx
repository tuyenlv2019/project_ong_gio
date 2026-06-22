import { Tooltip } from 'antd';
import { useLayoutEffect, useRef, useState } from 'react';

type EllipsisTextProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
};

function resolveText(children: React.ReactNode, title?: string) {
  if (title) return title;
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return undefined;
}

export default function EllipsisText({ children, title, className }: EllipsisTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);
  const tooltipTitle = resolveText(children, title);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const checkOverflow = () => {
      setTruncated(element.scrollWidth > element.clientWidth + 1);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children, tooltipTitle]);

  const content = (
    <span ref={ref} className={['ellipsis-text', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );

  if (!tooltipTitle || !truncated) return content;
  return <Tooltip title={tooltipTitle}>{content}</Tooltip>;
}
