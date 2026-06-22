import { Select, Tooltip } from 'antd';
import type { SelectProps } from 'antd';
import { useRef, useState } from 'react';

type HintSelectProps = SelectProps & {
  tooltip?: string;
};

function getSelectedLabel(
  value: SelectProps['value'],
  options: SelectProps['options'],
) {
  if (value === undefined || value === null || !options) return undefined;

  for (const option of options) {
    if (!option || typeof option !== 'object') continue;
    if ('options' in option) continue;
    if ('value' in option && option.value === value) {
      if (typeof option.label === 'string') return option.label;
      return undefined;
    }
  }

  return undefined;
}

function resolveHint(
  tooltip: string | undefined,
  placeholder: SelectProps['placeholder'],
  value: SelectProps['value'],
  options: SelectProps['options'],
  selector: HTMLElement | null,
) {
  if (tooltip) return tooltip;

  const selectedLabel = getSelectedLabel(value, options);
  const selectionItem = selector?.querySelector('.ant-select-selection-item');
  if (selectionItem && selectionItem.scrollWidth > selectionItem.clientWidth && selectedLabel) {
    return selectedLabel;
  }

  if (selectedLabel) return selectedLabel;
  if (typeof placeholder === 'string' && placeholder) return placeholder;
  return undefined;
}

function EllipsisOption({ label }: { label?: React.ReactNode }) {
  if (typeof label !== 'string') return label;
  return (
    <Tooltip title={label} mouseEnterDelay={0.35}>
      <span className="ellipsis-text">{label}</span>
    </Tooltip>
  );
}

export default function HintSelect({
  tooltip,
  placeholder,
  value,
  options,
  ...props
}: HintSelectProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState<string | undefined>();

  const refreshHint = () => {
    setHint(resolveHint(tooltip, placeholder, value, options, wrapRef.current));
  };

  return (
    <Tooltip title={hint} mouseEnterDelay={0.35} open={hint ? undefined : false}>
      <div ref={wrapRef} className="hint-control-wrap" onMouseEnter={refreshHint}>
        <Select
          placeholder={placeholder}
          value={value}
          options={options}
          optionRender={(option) => <EllipsisOption label={option.label} />}
          {...props}
        />
      </div>
    </Tooltip>
  );
}
