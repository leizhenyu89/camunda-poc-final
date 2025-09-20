import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Alert,
  Spin,
  Typography,
  Empty,
  Modal,
  Form,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { leaveApi, type Task } from "../api/leaveApi";

const { Title } = Typography;
const { TextArea } = Input;
const { Text } = Typography;

export function UnfinishedTasks() {
  const [assignee, setAssignee] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectForm] = Form.useForm();

  // 定义表格列
  const taskColumns: ColumnsType<Task> = [
    {
      title: "任务名称",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "任务ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
    },
    {
      title: "审批人",
      dataIndex: "assignee",
      key: "assignee",
      render: (assignee) => assignee || "未分配",
    },
    {
      title: "流程实例ID",
      dataIndex: "processInstanceId",
      key: "processInstanceId",
      ellipsis: true,
    },
    {
      title: "流程定义ID",
      dataIndex: "processDefinitionId",
      key: "processDefinitionId",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      fixed: "right",
      render: (_, task) => (
        <>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(task.id, true)}
            loading={approving === task.id}
            disabled={approving === task.id}
          >
            同意
          </Button>
          <Button
            danger
            style={{ marginLeft: 8 }}
            icon={<CloseCircleOutlined />}
            onClick={() => handleReject(task.id)}
            loading={approving === task.id}
            disabled={approving === task.id}
          >
            拒绝
          </Button>
        </>
      ),
    },
  ];

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await leaveApi.getTasks(assignee || undefined);
      setTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "查询任务失败");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string, approved: boolean) => {
    setApproving(taskId);
    try {
      await leaveApi.completeTask(taskId, { variables: { approved } });
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err: any) {
      setError(err.response?.data?.message || "审批失败");
    } finally {
      setApproving(null);
    }
  };

  // 处理拒绝流程，打开模态框
  const handleReject = (taskId: string) => {
    setCurrentTaskId(taskId);
    setRejectReason("");
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  // 确认拒绝，提交拒绝意见
  const handleConfirmReject = async () => {
    if (!currentTaskId || !rejectReason.trim()) {
      return;
    }

    setApproving(currentTaskId);
    try {
      // 提交任务完成请求，包含approved=false和reason（拒绝原因）
      await leaveApi.completeTask(currentTaskId, {
        variables: { approved: false, reason: rejectReason.trim() },
      });
      setTasks(tasks.filter((task) => task.id !== currentTaskId));
      setRejectModalVisible(false);
      setRejectReason("");
    } catch (err: any) {
      setError(err.response?.data?.message || "拒绝失败");
    } finally {
      setApproving(null);
    }
  };

  // 取消拒绝
  const handleCancelReject = () => {
    setRejectModalVisible(false);
    setRejectReason("");
    setCurrentTaskId(null);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="process-instance-page">
      <Title level={4} style={{ marginBottom: 16 }}>
        审批任务
      </Title>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="审批人过滤 (例如: lisi)"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              allowClear
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={loadTasks}
            loading={loading}
          >
            查询任务
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setAssignee("");
              loadTasks();
            }}
            loading={loading}
          >
            重置
          </Button>
        </div>
      </Card>

      <Card title="待审批任务列表" size="small" className="task-card-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin tip="加载中..." size="large" />
          </div>
        ) : tasks.length === 0 ? (
          <Empty description="暂无待审批任务" />
        ) : (
          <Table
            columns={taskColumns}
            dataSource={tasks}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            locale={{
              emptyText: "暂无待审批任务",
            }}
          />
        )}
      </Card>

      {/* 拒绝原因模态框 */}
      <Modal
        title="填写拒绝原因"
        open={rejectModalVisible}
        onOk={handleConfirmReject}
        onCancel={handleCancelReject}
        confirmLoading={approving === currentTaskId}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="reason"
            label={
              <Text mark style={{ color: "#ff4d4f" }}>
                拒绝原因（必填）
              </Text>
            }
            rules={[
              { required: true, message: "请输入拒绝原因" },
              { min: 1, message: "拒绝原因不能为空" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明拒绝原因"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
