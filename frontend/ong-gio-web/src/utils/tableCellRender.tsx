import EllipsisText from '../components/EllipsisText';

export function renderEllipsisCell(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const text = String(value);
  return <EllipsisText title={text}>{text}</EllipsisText>;
}
