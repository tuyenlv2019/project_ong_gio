import type { ColumnType } from 'antd/es/table';

type SttColumnOptions = {
  width?: number;
  fixed?: 'left' | 'right';
};

export function createSttColumn<T>(options?: SttColumnOptions): ColumnType<T> {
  return {
    title: 'STT',
    key: 'stt',
    width: options?.width ?? 56,
    align: 'center',
    fixed: options?.fixed,
    render: (_value, _record, index) => index + 1,
  };
}
