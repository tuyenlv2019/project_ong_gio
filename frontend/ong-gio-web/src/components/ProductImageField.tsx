import { PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { resolveMasterImageUrl } from '../utils/imageUrl';
import HintInput from './HintInput';

type ProductImageFieldProps = {
  value?: string;
  previewUrl?: string;
  onChange?: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  onRemoveCurrentImage?: (imageUrl: string) => Promise<void>;
};

export default function ProductImageField({
  value,
  previewUrl,
  onChange,
  onFileChange,
  onRemoveCurrentImage,
}: ProductImageFieldProps) {
  const imageUrl = previewUrl ?? resolveMasterImageUrl(value);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ được tải lên file ảnh');
      return Upload.LIST_IGNORE;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('Ảnh không được vượt quá 5MB');
      return Upload.LIST_IGNORE;
    }

    onFileChange?.(file);
    onChange?.('');
    return false;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Upload
        accept="image/*"
        listType="picture-card"
        showUploadList={false}
        beforeUpload={beforeUpload}
        className="product-image-upload"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Ảnh minh họa sản phẩm" className="product-image-upload-preview" />
        ) : (
          <div className="product-image-upload-placeholder">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
          </div>
        )}
      </Upload>
      <HintInput
        value={value}
        onChange={(event) => {
          onFileChange?.(null);
          onChange?.(event.target.value);
        }}
        placeholder="https://res.cloudinary.com/... hoặc URL ảnh"
        tooltip="Ảnh sẽ được upload lên Cloudinary khi bấm Lưu; bạn cũng có thể dán URL ảnh có sẵn"
      />
      {value ? (
        <Button
          size="small"
          onClick={() => {
            const currentValue = value.trim();
            Modal.confirm({
              title: 'Xóa ảnh minh họa?',
              content: 'Ảnh hiện tại sẽ bị xóa khỏi form và trên Cloudinary nếu bạn xác nhận.',
              okText: 'Xóa',
              cancelText: 'Hủy',
              okButtonProps: { danger: true },
              onOk: async () => {
                try {
                  if (currentValue && currentValue.includes('res.cloudinary.com')) {
                    await onRemoveCurrentImage?.(currentValue);
                  }
                  onFileChange?.(null);
                  onChange?.('');
                } catch (err) {
                  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                  message.error(msg || 'Không xóa được ảnh trên Cloudinary');
                }
              },
            });
          }}
        >
          Xóa ảnh
        </Button>
      ) : null}
    </Space>
  );
}
