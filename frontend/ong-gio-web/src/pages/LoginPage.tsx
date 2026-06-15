import { Card, Form, Input, Button, message, Spin } from 'antd';
import { LockOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../authService';

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaImageBase64, setCaptchaImageBase64] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const captcha = await authService.getCaptcha();
      setCaptchaToken(captcha.token);
      setCaptchaImageBase64(captcha.imageBase64);
      form.setFieldsValue({ captchaValue: '' });
    } catch (error) {
      console.error(error);
      message.error('Không thể tải captcha. Vui lòng thử lại.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  const onFinish = async (values: { tenDangNhap: string; matKhau: string; captchaValue: string }) => {
    setLoading(true);
    try {
      const result = await authService.login(
        values.tenDangNhap,
        values.matKhau,
        captchaToken,
        values.captchaValue
      );
      
      if (result.success) {
        message.success('Đăng nhập thành công!');
        navigate('/');
      } else {
        const msg = result.message || '';
        if (msg.toLowerCase().includes('captcha')) {
          message.error('Captcha không đúng');
        } else {
          message.error(msg || 'Đăng nhập thất bại');
        }
        await loadCaptcha();
      }
    } catch (error) {
      console.error(error);
      const apiMsg = (error as any)?.response?.data?.message;
      if (apiMsg && apiMsg.toLowerCase().includes('captcha')) {
        message.error('Captcha không đúng');
      } else {
        message.error('Lỗi khi đăng nhập. Vui lòng thử lại sau.');
      }
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <Card 
        style={{ width: 400 }}
        title="Đăng nhập"
        bordered={false}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="tenDangNhap"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                { min: 3, message: 'Tên đăng nhập ít nhất 3 ký tự' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Tên đăng nhập"
              />
            </Form.Item>

            <Form.Item
              name="matKhau"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Mật khẩu"
              />
            </Form.Item>

            <Form.Item
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Captcha</span>
                  <Button type="link" size="small" icon={<ReloadOutlined />} onClick={loadCaptcha}>
                    Làm mới
                  </Button>
                </div>
              }
              name="captchaValue"
              rules={[
                { required: true, message: 'Vui lòng nhập captcha' }
              ]}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {captchaImageBase64 && (
                  <img
                    src={`data:image/png;base64,${captchaImageBase64}`}
                    alt="Captcha"
                    style={{ width: '100%', height: 'auto', borderRadius: 4, border: '1px solid #d9d9d9' }}
                  />
                )}
                <Input
                  placeholder={captchaLoading ? 'Đang tải captcha...' : 'Nhập ký tự trong ảnh'}
                  disabled={!captchaImageBase64 || captchaLoading}
                />
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
