import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../../api';
import type { CalculationResult, LineFormValues, LoaiTon, NhomSanPham } from '../../types';
import { computeOrderTotals, calcLinePricing, EMPTY_ORDER_TOTALS } from '../../utils/orderFormPricing';
import EllipsisText from '../EllipsisText';
import HintInput from '../HintInput';
import HintInputNumber from '../HintInputNumber';
import HintSelect from '../HintSelect';
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

/** Hoãn remount ô phụ thuộc loại SP để dropdown phản hồi ngay. */
function useDeferredNhomId(nhomId: unknown) {
  const [renderedNhomId, setRenderedNhomId] = useState(nhomId);
  useEffect(() => {
    if (nhomId === renderedNhomId) return;
    const handle = requestAnimationFrame(() => setRenderedNhomId(nhomId));
    return () => cancelAnimationFrame(handle);
  }, [nhomId, renderedNhomId]);
  return renderedNhomId;
}

type NhomSelectOption = { value: number; label: string };

type NhomSelectCellProps = {
  fieldName: number;
  form: FormInstance;
  baseOptions: NhomSelectOption[];
  nhomList: NhomSanPham[];
  orderableNhomIds: Set<number>;
  rules?: { required: boolean; message: string }[];
};

/** Dropdown loại SP — options memo, virtual scroll, không re-render cả bảng. */
export const NhomSelectCell = memo(function NhomSelectCell({
  fieldName,
  form,
  baseOptions,
  nhomList,
  orderableNhomIds,
  rules,
}: NhomSelectCellProps) {
  const currentId = Form.useWatch(['lineInputs', fieldName, 'nhomSanPhamId'], form);
  const options = useMemo(() => {
    const id = Number(currentId);
    if (id && !orderableNhomIds.has(id)) {
      const legacy = nhomList.find((n) => n.id === id);
      if (legacy) {
        return [...baseOptions, { value: legacy.id, label: `${legacy.tenNhom} (chưa có công thức)` }];
      }
    }
    return baseOptions;
  }, [baseOptions, currentId, nhomList, orderableNhomIds]);

  return (
    <Form.Item name={[fieldName, 'nhomSanPhamId']} noStyle rules={rules}>
      <HintSelect
        placeholder="Chọn loại"
        options={options}
        virtual
        listHeight={280}
        popupMatchSelectWidth={false}
      />
    </Form.Item>
  );
});

type LineValueCellProps = {
  lineIndex: number;
  form: FormInstance;
  preview?: CalculationResult;
  loaiTonById: Map<number, LoaiTon>;
  withManualTonFlags: (items: LineFormValues[]) => LineFormValues[];
};

/** Ô đơn giá / thành tiền — chỉ re-render khi dòng đó hoặc preview đổi. */
export const LineValueCell = memo(function LineValueCell({
  lineIndex,
  form,
  preview,
  loaiTonById,
  withManualTonFlags,
}: LineValueCellProps) {
  const row = Form.useWatch(['lineInputs', lineIndex], form) as LineFormValues | undefined;
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
  onDimensionBlur?: (lineIndex: number) => void;
};

/** Ô kích thước — remount field hoãn 1 frame sau khi đổi loại SP. */
export const DimensionFieldsCell = memo(function DimensionFieldsCell({
  fieldName,
  form,
  nhomById,
  getDimensionFields,
  onDimensionBlur,
}: DimensionFieldsCellProps) {
  const nhomId = Form.useWatch(['lineInputs', fieldName, 'nhomSanPhamId'], form);
  const renderedNhomId = useDeferredNhomId(nhomId);
  const nhom = nhomById.get(Number(renderedNhomId));
  const dimensionFields = getDimensionFields(nhom);
  const isSwitching = nhomId !== renderedNhomId;

  if (isSwitching) {
    return <div className="dimension-fields-grid dimension-fields-switching" aria-busy="true" />;
  }

  return (
    <div className="dimension-fields-grid" data-dimension-line={fieldName}>
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
              onBlur={() => onDimensionBlur?.(fieldName)}
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

type TonInfoCellProps = {
  fieldName: number;
  loaiTonOptions: NhomSelectOption[];
  trongLuongKg?: number;
  loaiTonRules?: { required: boolean; message: string }[];
};

/** Ô loại tôn + khối lượng — khối lượng chỉ đổi khi preview dòng đó đổi. */
export const TonInfoCell = memo(function TonInfoCell({
  fieldName,
  loaiTonOptions,
  trongLuongKg,
  loaiTonRules,
}: TonInfoCellProps) {
  const weightText = trongLuongKg !== undefined ? `${trongLuongKg.toFixed(1)} kg` : '-';

  return (
    <div className="price-fields-stack ton-fields-stack">
      <div className="price-field-row">
        <FieldLabel>Loại Tôn</FieldLabel>
        <Form.Item name={[fieldName, 'loaiTonId']} noStyle rules={loaiTonRules}>
          <HintSelect
            className="ton-field-select"
            placeholder="Chọn tôn"
            tooltip="Loại tôn"
            options={loaiTonOptions}
            virtual
            listHeight={256}
          />
        </Form.Item>
      </div>
      <div className="price-field-row">
        <FieldLabel>Khối lượng(Kg)</FieldLabel>
        <span className="display-value ton-display-value" title={trongLuongKg !== undefined ? weightText : undefined}>
          {weightText}
        </span>
      </div>
    </div>
  );
});

function formatArea(value: number) {
  return value.toFixed(6);
}

type AreaPreviewCellProps = {
  preview?: CalculationResult;
};

/** Ô diện tích Sx — chỉ re-render khi preview dòng đó đổi. */
export const AreaPreviewCell = memo(function AreaPreviewCell({ preview }: AreaPreviewCellProps) {
  if (!preview) return <>-</>;

  return (
    <div className="price-fields-stack area-fields-stack">
      <div className="price-field-row">
        <FieldLabel>Ssx (m²)</FieldLabel>
        <span className="display-value area-display-value" title={`∑Ssx 1 cái: ${formatArea(preview.dienTichSx1Cai)} m²`}>
          {formatArea(preview.dienTichSx1Cai)}
        </span>
      </div>
      <div className="price-field-row">
        <FieldLabel>Ssx (mét tới)</FieldLabel>
        <span className="display-value area-display-value" title={`∑Ssx mét tới: ${formatArea(preview.dienTichSanXuatMetToi)} m`}>
          {formatArea(preview.dienTichSanXuatMetToi)}
        </span>
      </div>
    </div>
  );
});

/** Ô ghi chú + ảnh — ảnh cập nhật hoãn 1 frame sau khi đổi loại SP. */
export const LineGhiChuImageCell = memo(function LineGhiChuImageCell({
  fieldName,
  form,
  nhomById,
  requiredRulesFor,
}: LineGhiChuImageCellProps) {
  const nhomId = Form.useWatch(['lineInputs', fieldName, 'nhomSanPhamId'], form);
  const renderedNhomId = useDeferredNhomId(nhomId);
  const nhom = nhomById.get(Number(renderedNhomId));
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
