import dayjs from 'dayjs';
import type { ColumnType } from 'antd/es/table';
import EllipsisText from '../components/EllipsisText';

export type AuditableRecord = {
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export function formatAuditDateTime(value?: string) {
  if (!value) return '—';
  const parsed = dayjs(value);
  if (!parsed.isValid() || parsed.year() <= 1) return '—';
  return parsed.format('DD/MM/YYYY HH:mm');
}

export function formatAuditUser(value?: string) {
  return value?.trim() || '—';
}

function renderAuditCell(user: string, date: string) {
  const title = `${user} — ${date}`;
  return (
    <EllipsisText title={title}>
      <span className="audit-cell">
        <span className="audit-cell-user">{user}</span>
        <span className="audit-cell-date">{date}</span>
      </span>
    </EllipsisText>
  );
}

export function createAuditColumns<T extends AuditableRecord>(
  options?: {
    getCreatedAt?: (row: T) => string;
    getUpdatedAt?: (row: T) => string;
  },
): ColumnType<T>[] {
  return [
    {
      title: 'Tạo',
      width: 80,
      ellipsis: true,
      onCell: () => ({ className: 'audit-column-cell' }),
      render: (_: unknown, row: T) =>
        renderAuditCell(
          formatAuditUser(row.createdBy),
          options?.getCreatedAt?.(row) ?? formatAuditDateTime(row.createdAt),
        ),
    },
    {
      title: 'Cập nhật',
      width: 80,
      ellipsis: true,
      onCell: () => ({ className: 'audit-column-cell' }),
      render: (_: unknown, row: T) =>
        renderAuditCell(
          formatAuditUser(row.updatedBy),
          options?.getUpdatedAt?.(row) ?? formatAuditDateTime(row.updatedAt),
        ),
    },
  ];
}

export function getAuditSearchText(row: AuditableRecord) {
  return [
    formatAuditUser(row.createdBy),
    formatAuditDateTime(row.createdAt),
    formatAuditUser(row.updatedBy),
    formatAuditDateTime(row.updatedAt),
    row.createdBy,
    row.createdAt,
    row.updatedBy,
    row.updatedAt,
  ];
}
