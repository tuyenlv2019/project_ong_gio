import './FormulaDisplay.css';

function normalizeFormulaLines(formula: string): string[] {
  return formula
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .split('\n');
}

type FormulaDisplayProps = {
  value?: string | null;
  variant?: 'block' | 'inline';
  emptyText?: string;
};

/**
 * Hiển thị công thức ∑Ssx — mỗi dòng trong chuỗi công thức xuống dòng riêng.
 */
export default function FormulaDisplay({
  value,
  variant = 'block',
  emptyText = '—',
}: FormulaDisplayProps) {
  if (!value?.trim()) {
    return <span className="formula-display-empty">{emptyText}</span>;
  }

  const lines = normalizeFormulaLines(value);

  return (
    <div className={`formula-display formula-display--${variant}`}>
      {lines.map((line, index) => (
        <div key={index} className="formula-display-line">
          {line}
        </div>
      ))}
    </div>
  );
}
