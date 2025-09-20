import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Card, Typography, message } from 'antd';
import { leaveApi } from '../api/leaveApi';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface FormData {
  businessKey: string;
  employeeName: string;
  leaveType: string;
  startTime: Dayjs;
  endTime: Dayjs;
  days: number;
  reason: string;
  manager: string;
}

const LeaveApplication: React.FC = () => {
  const [form] = Form.useForm<FormData>();

  // 添加useEffect钩子，在组件加载时自动生成业务键
  useEffect(() => {
    const generateBusinessKey = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      return `LEAVE-${year}-${month}-${randomNum}`;
    };

    const businessKey = generateBusinessKey();
    form.setFieldsValue({ businessKey });
  }, [form]);

  const handleSubmit = async (values: FormData) => {
    try {
      // 自动生成业务键（当用户未填写时）
      const businessKey = values.businessKey || (
        () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
          return `LEAVE-${year}-${month}-${randomNum}`;
        }
      )();

      // 提交请假申请
      const result = await leaveApi.applyLeave({
        businessKey,
        applicant: values.employeeName,
        manager: values.manager,
        leaveType: values.leaveType,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        reason: values.reason,
        leaveDays: values.days
      });

      if (result) {
        message.success('请假申请提交成功！');
        form.resetFields();
      }
    } catch (error) {
      message.error('提交失败，请重试');
      console.error('提交失败:', error);
    }
  };

  return (
    <Card title={<Title level={4}>请假申请</Title>} style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          leaveType: 'annual',
          days: 1
        }}
      >
        <Form.Item
          label="业务键"
          name="businessKey"
          tooltip="系统自动生成，也可手动修改"
        >
          <Input placeholder="系统将自动生成业务键" />
        </Form.Item>

        <Form.Item
          label="员工姓名"
          name="employeeName"
          rules={[{ required: true, message: '请输入员工姓名' }]}
        >
          <Input placeholder="请输入员工姓名" />
        </Form.Item>

        <Form.Item
          label="请假类型"
          name="leaveType"
          rules={[{ required: true, message: '请选择请假类型' }]}
        >
          <Select placeholder="请选择请假类型">
            <Select.Option value="annual">年假</Select.Option>
            <Select.Option value="sick">病假</Select.Option>
            <Select.Option value="personal">事假</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="开始时间"
          name="startTime"
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <DatePicker
            showTime
            placeholder="请选择开始时间"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="结束时间"
          name="endTime"
          rules={[{ required: true, message: '请选择结束时间' }]}
        >
          <DatePicker
            showTime
            placeholder="请选择结束时间"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="请假天数"
          name="days"
          rules={[{ required: true, message: '请输入请假天数' }]}
        >
          <InputNumber min={0.5} step={0.5} />
        </Form.Item>

        <Form.Item
          label="请假原因"
          name="reason"
          rules={[{ required: true, message: '请输入请假原因' }]}
        >
          <TextArea rows={4} placeholder="请输入请假原因" />
        </Form.Item>

        <Form.Item
          label="审批人"
          name="manager"
          rules={[{ required: true, message: '请输入审批人' }]}
        >
          <Input placeholder="请输入审批人姓名" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            提交申请
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LeaveApplication;
