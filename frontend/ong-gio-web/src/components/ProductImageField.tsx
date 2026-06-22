import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { useState } from 'react';
import { uploadNhomSanPhamImage } from '../api';
import { resolveMasterImageUrl } from '../utils/imageUrl';
import HintInput from './HintInput';

type ProductImageFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export default function ProductImageField({ value, onChange }: ProductImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const imageUrl = resolveMasterImageUrl(value);

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true);
      const path = await uploadNhomSanPhamImage(file as File);
      onChange?.(path);
      onSuccess?.(path);
      message.success('Đã tải ảnh lên');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(msg || 'Tải ảnh thất bại');
      onError?.(err as Error);
    } finally {
      setUploading(false);
    }
  };

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

    return true;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Upload
        accept="image/*"
        listType="picture-card"
        showUploadList={false}
        customRequest={handleUpload}
        beforeUpload={beforeUpload}
        disabled={uploading}
        className="product-image-upload"
      >
        {uploading ? (
          <LoadingOutlined />
        ) : imageUrl ? (
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
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="/images/uploads/ten-anh.png hoặc URL ảnh"
        tooltip="Đường dẫn ảnh sau khi upload, hoặc dán URL ảnh có sẵn"
      />
      {value ? (
        <Button size="small" onClick={() => onChange?.('')}>
          Xóa ảnh
        </Button>
      ) : null}
    </Space>
  );
}
