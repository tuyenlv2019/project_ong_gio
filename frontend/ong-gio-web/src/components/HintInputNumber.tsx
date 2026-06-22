import { InputNumber, Tooltip } from 'antd';
import type { InputNumberProps } from 'antd';
import { useRef, useState } from 'react';

type HintInputNumberProps = InputNumberProps & {
  tooltip?: string;
};

function resolveHint(
  tooltip: string | undefined,
  placeholder: InputNumberProps['placeholder'],
  addonBefore: InputNumberProps['addonBefore'],
  input: HTMLInputElement | null,
) {
  if (tooltip) return tooltip;
  if (input?.value && input.scrollWidth > input.clientWidth) return input.value;
  if (typeof placeholder === 'string' && placeholder) return placeholder;
  if (typeof addonBefore === 'string' && addonBefore) return addonBefore;
  return undefined;
}

export default function HintInputNumber({
  tooltip,
  placeholder,
  addonBefore,
  ...props
}: HintInputNumberProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [hint, setHint] = useState<string | undefined>();

  const refreshHint = () => {
    const input = wrapRef.current?.querySelector('input') ?? null;
    setHint(resolveHint(tooltip, placeholder, addonBefore, input));
  };

  return (
    <Tooltip title={hint} mouseEnterDelay={0.35} open={hint ? undefined : false}>
      <span ref={wrapRef} className="hint-control-wrap" onMouseEnter={refreshHint}>
        <InputNumber placeholder={placeholder} addonBefore={addonBefore} {...props} />
      </span>
    </Tooltip>
  );
}
