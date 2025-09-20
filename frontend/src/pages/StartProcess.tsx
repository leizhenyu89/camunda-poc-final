import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Alert, Space } from 'antd';
import { leaveApi } from '../api/leaveApi';

const { Title } = Typography;
const { TextArea } = Input;

export function StartProcess() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await leaveApi.startProcess({
        businessKey: values.businessKey || undefined,
        variables: {
          applicant: values.applicant,
          manager: values.manager,
        },
      });
      setResult(response);
      message.success('流程启动成功！');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '启动流程失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setResult(null);
    setError(null);
  };

  return (
    <div className="process-definition-page">
      <Card
        title={<Title level={4}>启动请假流程</Title>}
        variant="outlined"
        className="process-start-card"
      >
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {result && (
          <Alert
            message="流程启动成功！"
            description={
              <div>
                <p><strong>流程实例ID:</strong> {result.id}</p>
                <p><strong>业务键:</strong> {result.businessKey}</p>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            businessKey: '',
            applicant: '',
            manager: '',
          }}
        >
          <Form.Item
            name="businessKey"
            label="业务键 (可选)"
            tooltip="用于标识流程实例的业务关联ID"
          >
            <Input
              placeholder="例如: L-2024-0001"
              maxLength={50}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="applicant"
            label="申请人"
            rules={[
              { required: true, message: '请输入申请人姓名' },
              { max: 20, message: '申请人姓名不能超过20个字符' }
            ]}
            tooltip="请假流程的申请人"
          >
            <Input
              placeholder="例如: zhangsan"
              maxLength={20}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="manager"
            label="部门经理"
            rules={[
              { required: true, message: '请输入部门经理姓名' },
              { max: 20, message: '部门经理姓名不能超过20个字符' }
            ]}
            tooltip="负责审批请假的部门经理"
          >
            <Input
              placeholder="例如: lisi"
              maxLength={20}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={resetForm}>
                重置
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {loading ? '启动中...' : '启动流程'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
