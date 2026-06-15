import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { createLoaiTon, deleteLoaiTon, formatMoney, getLoaiTons, updateLoaiTon } from '../api';
import type { LoaiTon } from '../types';

export default function MaterialsPage() {
  const [data, setData] = useState<LoaiTon[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LoaiTon | null>(null);
  const [form] = Form.useForm();

  const load = async () => setData(await getLoaiTons());
  useEffect(() => {
    load();
  }, []);

  const openModal = (item?: LoaiTon) => {
    setEditing(item ?? null);
    form.setFieldsValue(
      item ?? { thuongHieu: '', doDay: 0.58, donGiaM2: 185000, giaSanCoDinh: 150000, bangBaremJson: '[]' },
    );
    setOpen(true);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateLoaiTon(editing.id, values);
      message.success('Đã cập nhật');
    } else {
      await createLoaiTon(values);
      message.success('Đã thêm loại tôn');
    }
    setOpen(false);
    load();
  };

  return (
    <Card
      title="Quản lý nguyên liệu (Tôn)"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm loại tôn
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={data}
        columns={[
          { title: 'Thương hiệu', dataIndex: 'thuongHieu' },
          { title: 'Độ dày (mm)', dataIndex: 'doDay' },
          { title: 'Đơn giá/m²', dataIndex: 'donGiaM2', render: (v) => formatMoney(v) },
          { title: 'Giá sàn', dataIndex: 'giaSanCoDinh', render: (v) => formatMoney(v) },
          {
            title: 'Thao tác',
            render: (_, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                <Popconfirm
                  title="Xóa loại tôn?"
                  onConfirm={async () => {
                    await deleteLoaiTon(row.id);
                    message.success('Đã xóa');
                    load();
                  }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Sửa loại tôn' : 'Thêm loại tôn'}
        open={open}
        onOk={onSave}
        onCancel={() => setOpen(false)}
        okText="Lưu"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="thuongHieu" label="Thương hiệu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="doDay" label="Độ dày (mm)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>
          <Form.Item name="donGiaM2" label="Đơn giá/m²" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="giaSanCoDinh" label="Giá sàn (&lt;1m²)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="bangBaremJson" label="Barem JSON">
            <Input.TextArea rows={3} placeholder='[{"do_day":0.58,"ty_trong":4.5}]' />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
