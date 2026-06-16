/**
 * Trang quản lý nhóm sản phẩm và tham số cố định động.
 */
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { createNhomSanPham, deleteNhomSanPham, getNhomSanPhams, updateNhomSanPham } from '../api';
import type { NhomSanPham, ThamSoCoDinh } from '../types';

export default function ProductsPage() {
  const [data, setData] = useState<NhomSanPham[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NhomSanPham | null>(null);
  const [form] = Form.useForm();

  const load = async () => setData(await getNhomSanPhams());
  useEffect(() => {
    load();
  }, []);

  const openModal = (item?: NhomSanPham) => {
    setEditing(item ?? null);
    form.setFieldsValue({
      tenNhom: item?.tenNhom ?? '',
      hinhAnhMinhHoa: item?.hinhAnhMinhHoa ?? '',
      thamSo: item?.thamSoCoDinhs?.map((t) => ({ tenThamSo: t.tenThamSo, giaTriSo: t.giaTriSo })) ?? [
        { tenThamSo: 'L', giaTriSo: 300 },
      ],
    });
    setOpen(true);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateNhomSanPham(editing.id, values);
      message.success('Đã cập nhật sản phẩm');
    } else {
      await createNhomSanPham(values);
      message.success('Đã thêm sản phẩm');
    }
    setOpen(false);
    load();
  };

  return (
    <Card
      title="Quản lý sản phẩm"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm sản phẩm
        </Button>
      }
    >
      <Table
        rowKey="id"
        dataSource={data}
        columns={[
          { title: 'Tên nhóm', dataIndex: 'tenNhom' },
          {
            title: 'Hằng số kỹ thuật',
            dataIndex: 'thamSoCoDinhs',
            render: (ts: ThamSoCoDinh[]) => ts?.map((t) => `${t.tenThamSo}=${t.giaTriSo}`).join(', '),
          },
          {
            title: 'Thao tác',
            render: (_, row) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(row)} />
                <Popconfirm
                  title="Xóa sản phẩm?"
                  onConfirm={async () => {
                    await deleteNhomSanPham(row.id);
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

      <Modal title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} open={open} onOk={onSave} onCancel={() => setOpen(false)} width={640}>
        <Form form={form} layout="vertical">
          <Form.Item name="tenNhom" label="Tên nhóm" rules={[{ required: true }]}>
            <Input placeholder="Co 90 độ, Ống thẳng..." />
          </Form.Item>
          <Form.Item name="hinhAnhMinhHoa" label="Ảnh minh họa (URL)">
            <Input />
          </Form.Item>
          <Form.List name="thamSo">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline">
                    <Form.Item {...field} name={[field.name, 'tenThamSo']} rules={[{ required: true }]}>
                      <Input placeholder="R, L..." />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'giaTriSo']} rules={[{ required: true }]}>
                      <InputNumber placeholder="Giá trị" />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      Xóa
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  + Thêm hằng số
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
}
