/**
 * Modal đổi mật khẩu cho user đang đăng nhập.
 */
import { Form, Input, Modal, message } from 'antd';
import { authService } from '../authService';

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ChangePasswordForm = {
  matKhauCu: string;
  matKhauMoi: string;
  xacNhanMatKhauMoi: string;
};

export default function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const [form] = Form.useForm<ChangePasswordForm>();

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const onFinish = async (values: ChangePasswordForm) => {
    const result = await authService.changePassword(
      values.matKhauCu,
      values.matKhauMoi,
      values.xacNhanMatKhauMoi
    );

    if (!result.success) {
      message.error(result.message || 'Đổi mật khẩu thất bại');
      return;
    }

    message.success(result.message || 'Đổi mật khẩu thành công');
    handleClose();
    onSuccess();
  };

  return (
    <Modal
      title="Đổi mật khẩu"
      open={open}
      onCancel={handleClose}
      onOk={() => form.submit()}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="matKhauCu"
          label="Mật khẩu hiện tại"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="matKhauMoi"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="xacNhanMatKhauMoi"
          label="Xác nhận mật khẩu mới"
          dependencies={['matKhauMoi']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('matKhauMoi') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
