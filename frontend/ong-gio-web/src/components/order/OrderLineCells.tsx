import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../../api';
import type { CalculationResult, LineFormValues, LoaiTon, NhomSanPham } from '../../types';
import { computeOrderTotals, calcLinePricing, EMPTY_ORDER_TOTALS } from '../../utils/orderFormPricing';
import EllipsisText from '../EllipsisText';
import HintInput from '../HintInput';
import HintInputNumber from '../HintInputNumber';
import { resolveMasterImageUrl } from '../../utils/imageUrl';

const TOTALS_DEBOUNCE_MS = 120;

function FieldLabel({ children }: { children: string }) {
  return <EllipsisText className="price-field-label">{children}</EllipsisText>;
}

type DimensionField = {
  key: string;
  label: string;
  target: 'w' | 'h' | 'thamSoNhap';
  paramKey?: string;
};

type OrderTotalsFooterProps = {
  form: FormInstance;
  linePreviews: Record<number, CalculationResult>;
  loaiTonById: Map<number, LoaiTon>;
  withManualTonFlags: (items: LineFormValues[]) => LineFormValues[];
};

/** Footer tổng tiền — tự subscribe form, không làm re-render cả bảng khi gõ. */
export const OrderTotalsFooter = memo(function OrderTotalsFooter({
  form,
  linePreviews,
  loaiTonById,
  withManualTonFlags,
}: OrderTotalsFooterProps) {
  const lineInputs = Form.useWatch('lineInputs', form);
  const [totals, setTotals] = useState(EMPTY_ORDER_TOTALS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const recompute = useMemo(
    () => () => {
      const items = withManualTonFlags((lineInputs as LineFormValues[] | undefined) || []);
      setTotals(computeOrderTotals(items, linePreviews, loaiTonById));
    },
    [lineInputs, linePreviews, loaiTonById, withManualTonFlags],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(recompute, TOTALS_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [recompute]);

  return (
    <div style={{ padding: '12px', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', justifyItems: 'end' }}>
        <div />
        <div style={{ minWidth: '450px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px auto', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>Tổng trước thuế:</span>
              <span style={{ fontWeight: 'bold', color: '#1677ff', textAlign: 'right' }}>{formatMoney(totals.tongTien)} đ</span>
            </div>
            {totals.thueTheoLoai
              .filter((group) => group.tienThue > 0)
              .map((group) => (
                <div
                  key={group.thueSuat}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px auto',
                    gap: '16px',
                    alignItems: 'center',
                    color: '#666',
                  }}
                >
                  <span>Thuế VAT {group.thueSuat}%:</span>
                  <span style={{ textAlign: 'right' }}>{formatMoney(Math.round(group.tienThue))} đ</span>
                </div>
              ))}
            {totals.thueTien > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '200px auto',
                  gap: '16px',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '2px solid #ff7a45',
                  fontWeight: 'bold',
                  color: '#ff7a45',
                  fontSize: '16px',
                }}
              >
                <span>Tổng sau thuế:</span>
                <span style={{ textAlign: 'right' }}>{formatMoney(Math.round(totals.tongTienSauThue))} đ</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

type LineValueCellProps = {
  lineIndex: number;
  form: FormInstance;
  linePreviews: Record<number, CalculationResult>;
  loaiTonById: Map<number, LoaiTon>;
  withManualTonFlags: (items: LineFormValues[]) => LineFormValues[];
};

/** Ô đơn giá / thành tiền — chỉ re-render khi dòng đó hoặc preview đổi. */
export const LineValueCell = memo(function LineValueCell({
  lineIndex,
  form,
  linePreviews,
  loaiTonById,
  withManualTonFlags,
}: LineValueCellProps) {
  const row = Form.useWatch(['lineInputs', lineIndex], form) as LineFormValues | undefined;
  const preview = linePreviews[lineIndex];
  if (!preview) return <>-</>;

  const item = withManualTonFlags([row ?? {} as LineFormValues])[0];
  const ton = loaiTonById.get(Number(item?.loaiTonId));
  const { unitPrice, lineTotal } = calcLinePricing(preview, item, ton?.donGiaMetToi);
  const unitPriceText = formatMoney(unitPrice);
  const lineTotalText = formatMoney(lineTotal);

  return (
    <div className="price-fields-stack area-fields-stack value-fields-stack">
      <div className="price-field-row">
        <FieldLabel>Đơn giá(VND)</FieldLabel>
        <span className="display-value value-display-value" title={`Đơn giá: ${unitPriceText} đ`}>
          {unitPriceText}
        </span>
      </div>
      <div className="price-field-row">
        <FieldLabel>Thành tiền(VND)</FieldLabel>
        <span className="display-value value-display-value" title={`Thành tiền: ${lineTotalText} đ`}>
          {lineTotalText}
        </span>
      </div>
    </div>
  );
});

type DimensionFieldsCellProps = {
  fieldName: number;
  form: FormInstance;
  nhomById: Map<number, NhomSanPham>;
  getDimensionFields: (nhom?: NhomSanPham) => DimensionField[];
};

/** Ô kích thước — chỉ re-render khi loại SP của dòng đổi. */
export const DimensionFieldsCell = memo(function DimensionFieldsCell({
  fieldName,
  form,
  nhomById,
  getDimensionFields,
}: DimensionFieldsCellProps) {
  const nhomId = Form.useWatch(['lineInputs', fieldName, 'nhomSanPhamId'], form);
  const nhom = nhomById.get(Number(nhomId));
  const dimensionFields = getDimensionFields(nhom);

  return (
    <div className="dimension-fields-grid">
      {dimensionFields.map((dimension) => {
        const name = dimension.target === 'thamSoNhap'
          ? [fieldName, 'thamSoNhap', dimension.paramKey ?? dimension.key]
          : [fieldName, dimension.target];

        return (
          <Form.Item
            key={dimension.key}
            name={name}
            noStyle
            rules={[{ required: true, message: `Nhập ${dimension.label}` }]}
          >
            <HintInputNumber
              className="dimension-field-input"
              min={dimension.key === 'phan_manh' ? 1 : 0}
              step={dimension.key === 'phan_manh' ? 1 : 10}
              placeholder={dimension.label}
              tooltip={dimension.label}
              addonBefore={dimension.label}
              controls={false}
              style={{ width: '100%' }}
            />
          </Form.Item>
        );
      })}
    </div>
  );
});

type LineGhiChuImageCellProps = {
  fieldName: number;
  form: FormInstance;
  nhomById: Map<number, NhomSanPham>;
  requiredRulesFor: (title: string) => { required: boolean; message: string }[] | undefined;
};

/** Ô ghi chú + ảnh — chỉ re-render khi loại SP của dòng đổi. */
export const LineGhiChuImageCell = memo(function LineGhiChuImageCell({
  fieldName,
  form,
  nhomById,
  requiredRulesFor,
}: LineGhiChuImageCellProps) {
  const nhomId = Form.useWatch(['lineInputs', fieldName, 'nhomSanPhamId'], form);
  const nhom = nhomById.get(Number(nhomId));
  const imageUrl = resolveMasterImageUrl(nhom?.hinhAnhMinhHoa);

  return (
    <div className="price-fields-stack">
      <div className="price-field-row">
        <FieldLabel>Ghi chú</FieldLabel>
        <Form.Item
          name={[fieldName, 'ghiChu']}
          noStyle
          rules={
            requiredRulesFor('Ghi chú')
            ?? (requiredRulesFor('Ghi chú/ hình ảnh') ? [{ required: true, message: 'Nhập ghi chú' }] : undefined)
          }
        >
          <HintInput placeholder="Nhập ghi chú" />
        </Form.Item>
      </div>
      <div className="price-field-row">
        <FieldLabel>Hình ảnh</FieldLabel>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nhom?.tenNhom ?? 'Minh họa sản phẩm'}
            className="product-master-image"
          />
        ) : (
          <span className="display-value">-</span>
        )}
      </div>
    </div>
  );
});
