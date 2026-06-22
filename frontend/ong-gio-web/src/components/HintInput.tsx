import { Input, Tooltip } from 'antd';
import type { InputProps } from 'antd';
import { useRef, useState } from 'react';

type HintInputProps = InputProps & {
  tooltip?: string;
};

function resolveHint(
  tooltip: string | undefined,
  placeholder: InputProps['placeholder'],
  input: HTMLInputElement | HTMLTextAreaElement | null,
) {
  if (tooltip) return tooltip;
  if (input?.value && input.scrollWidth > input.clientWidth) return input.value;
  if (typeof placeholder === 'string' && placeholder) return placeholder;
  return undefined;
}

export default function HintInput({ tooltip, placeholder, ...props }: HintInputProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [hint, setHint] = useState<string | undefined>();

  const refreshHint = () => {
    const input = wrapRef.current?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
    setHint(resolveHint(tooltip, placeholder, input));
  };

  return (
    <Tooltip title={hint} mouseEnterDelay={0.35} open={hint ? undefined : false}>
      <span ref={wrapRef} className="hint-control-wrap" onMouseEnter={refreshHint}>
        <Input placeholder={placeholder} {...props} />
      </span>
    </Tooltip>
  );
}
