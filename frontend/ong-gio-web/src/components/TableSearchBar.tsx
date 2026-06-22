import { SearchOutlined } from '@ant-design/icons';
import HintInput from './HintInput';

type TableSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function TableSearchBar({
  value,
  onChange,
  placeholder = 'Tìm kiếm trong danh sách...',
}: TableSearchBarProps) {
  return (
    <HintInput
      allowClear
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ marginBottom: 16, maxWidth: 420 }}
    />
  );
}
