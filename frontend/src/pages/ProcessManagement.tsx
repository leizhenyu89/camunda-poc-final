import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Button,
  Select,
  Tag,
  Space,
  message,
  Card,
  Typography,
  Empty,
  Spin,
  Descriptions,
  Modal,
  Timeline,
  Badge,
} from "antd";
import {
  EyeOutlined,
  StopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TablePaginationConfig } from "antd";
import {
  leaveApi,
  type CompletedProcess,
  type CompletedTask,
  type LeaveApplication,
  type ExecutionPath,
} from "../api/leaveApi";
import { processApi } from "../api/processApi";
import type { ProcessInstance } from "../entity/ProcessDefinition";

import { ProcessInstances } from './ProcessInstances';
import { ApplicationHistory } from './ApplicationHistory';
import { CompletedTasks } from './CompletedTasks';

const { Title } = Typography;

export const ProcessManagement: React.FC = () => {
  // 通用状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 流程实例管理状态
  const [processInstances, setProcessInstances] = useState<ProcessInstance[]>([]);
  const [searchKey, setSearchKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [instancesPagination, setInstancesPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  });

  // 流程执行轨迹状态
  const [executionPaths, setExecutionPaths] = useState<ExecutionPath[]>([]);
  const [executionPathLoading, setExecutionPathLoading] = useState(false);
  const [processDetailsModalVisible, setProcessDetailsModalVisible] = useState(false);
  const [currentProcessInstance, setCurrentProcessInstance] = useState<ProcessInstance | null>(null);

  // 我的申请历史状态 - 已移至ApplicationHistory组件，保留引用以便传递给子组件
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>("all");
  const [applicationsPagination, setApplicationsPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `第${range[0]}-${range[1]}条，共${total}条`,
  });
  const [userIdSearch, setUserIdSearch] = useState<string>("");

  // 以下函数已经移至子组件中，但保留引用以便传递给子组件
  const loadLeaveApplications = async () => {
    // 此函数已移至ApplicationHistory组件中
    // 这里仅保留空实现以避免编译错误
    console.warn("loadLeaveApplications函数已移至ApplicationHistory组件");
  };

  const viewApplication = (application: LeaveApplication) => {
    // 此函数已移至ApplicationHistory组件中
    // 这里仅保留空实现以避免编译错误
    console.warn("viewApplication函数已移至ApplicationHistory组件");
  };

  // 已完成任务状态
  const [completedProcesses, setCompletedProcesses] = useState<CompletedProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // 加载流程实例数据
  const loadProcessInstances = async () => {
    setLoading(true);
    setError(null);

    try {
      // 准备参数
      const params: any = {};

      // 搜索关键词处理
      if (searchKey) {
        params.businessKey = searchKey;
      }

      // 状态筛选处理
      if (statusFilter === "active") {
        params.active = true;
      } else if (statusFilter === "completed") {
        params.completed = true;
      }

      // 分页参数
      params.page = instancesPagination.current;
      params.size = instancesPagination.pageSize;

      // 排序参数
      params.sort = "startTime";
      params.order = "desc";

      // 调用新的API获取流程实例
      const response = await processApi.getAllProcessInstances(
        undefined, // processDefinitionKey
        params.businessKey,
        params.active,
        params.completed,
        params.page,
        params.size,
        params.sort,
        params.order
      );

      // 处理数据，确保所有必要字段都有值
      const processedData = response.data.map((instance) => ({
        ...instance,
        // 确保所有必要字段都有默认值
        businessKey: instance.businessKey || "无",
        variables: instance.variables || {},
        // 尝试转换时间，但如果失败也不影响程序运行
        startTime: instance.startTime
          ? typeof instance.startTime === "string"
            ? new Date(instance.startTime)
            : instance.startTime
          : null,
        endTime: instance.endTime
          ? typeof instance.endTime === "string"
            ? new Date(instance.endTime)
            : instance.endTime
          : null,
      }));

      setProcessInstances(processedData);
      setInstancesPagination((prev) => ({ ...prev, total: response.total }));
      message.success("流程实例加载成功");
    } catch (err: any) {
      console.error("加载流程实例失败:", err);
      setError(err.response?.data?.message || "加载流程实例失败");
      message.error("加载流程实例失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载已结束流程
  const loadCompletedProcesses = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await leaveApi.getCompletedProcesses();
      setCompletedProcesses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "查询已结束流程失败");
      message.error("查询已结束流程失败");
    } finally {
      setLoading(false);
    }
  };

  // 加载流程的已完成任务
  const loadCompletedTasks = async (processInstanceId: string) => {
    setTasksLoading(true);
    try {
      const data = await leaveApi.getCompletedTasks(processInstanceId);
      setCompletedTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "查询已完成任务失败");
      message.error("查询已完成任务失败");
    } finally {
      setTasksLoading(false);
    }
  };

  // 查看流程实例详情
  const viewProcessInstance = async (instance: ProcessInstance) => {
    setCurrentProcessInstance(instance);
    setExecutionPathLoading(true);

    try {
      const paths = await leaveApi.getProcessExecutionPath(instance.id);
      setExecutionPaths(paths);
      setProcessDetailsModalVisible(true);
    } catch (err) {
      console.error("获取流程执行轨迹失败:", err);
      message.error("获取流程执行轨迹失败");
    } finally {
      setExecutionPathLoading(false);
    }
  };

  // 挂起流程实例
  const suspendProcessInstance = (instance: ProcessInstance) => {
    console.log("挂起流程实例:", instance.id);
    message.success("流程实例已挂起");
    // 在实际应用中，这里会调用API来挂起流程实例
    // 然后刷新列表
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  // 格式化持续时间
  const formatDuration = (millis: number) => {
    const hours = Math.floor(millis / (1000 * 60 * 60));
    const minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  // 获取活动类型对应的图标
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "start":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "task":
        return <UserOutlined style={{ color: "#52c41a" }} />;
      case "gateway":
        return <CheckCircleOutlined style={{ color: "#faad14" }} />;
      case "end":
        return <CheckCircleOutlined style={{ color: "#f5222d" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
    }
  };

  // 流程实例表格列定义
  const processInstanceColumns: ColumnsType<ProcessInstance> = [
    {
      title: "业务键",
      dataIndex: "businessKey",
      key: "businessKey",
      ellipsis: true,
      render: (businessKey) => businessKey || "无",
    },
    {
      title: "流程实例ID",
      dataIndex: "id",
      key: "id",
      ellipsis: true,
    },
    {
      title: "申请人",
      key: "employeeName",
      render: (_, record) => {
        try {
          // 同时检查两种可能的字段名，确保兼容性
          return (
            record.variables?.employeeName ||
            record.variables?.applicant ||
            "未知"
          );
        } catch (error) {
          console.error("获取申请人信息失败:", error);
          return "未知";
        }
      },
    },
    {
      title: "流程定义键",
      dataIndex: "processDefinitionKey",
      key: "processDefinitionKey",
      ellipsis: true,
    },
    {
      title: "开始时间",
      key: "startTime",
      render: (_, record) => {
        try {
          return record.startTime
            ? new Date(record.startTime).toLocaleString("zh-CN")
            : "未知";
        } catch (error) {
          return "未知";
        }
      },
    },
    {
      title: "结束时间",
      key: "endTime",
      sortOrder: "descend",
      render: (_, record) => {
        try {
          return record.endTime
            ? new Date(record.endTime).toLocaleString("zh-CN")
            : "未知";
        } catch (error) {
          return "未知";
        }
      },
    },
    {
      title: "状态",
      key: "status",
      render: (_, record) => {
        if (record.suspended) {
          return <Tag color="error">已挂起</Tag>;
        }
        return record.endTime ? (
          <Tag color="success">已完成</Tag>
        ) : (
          <Tag color="processing">进行中</Tag>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewProcessInstance(record)}
          >
            查看
          </Button>
          {!record.endTime && (
            <Button
              type="link"
              danger
              icon={<StopOutlined />}
              onClick={() => suspendProcessInstance(record)}
            >
              挂起
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 初始化加载数据
  useEffect(() => {
    loadCompletedProcesses();
    loadProcessInstances();
  }, []);

  // 定义标签页项
  const tabItems = [
    {
      key: "1",
      label: "流程实例管理",
      children: (
        <ProcessInstances
          loading={loading}
          processInstances={processInstances}
          searchKey={searchKey}
          statusFilter={statusFilter}
          instancesPagination={instancesPagination}
          setSearchKey={setSearchKey}
          setStatusFilter={setStatusFilter}
          setInstancesPagination={setInstancesPagination}
          loadProcessInstances={loadProcessInstances}
          viewProcessInstance={viewProcessInstance}
          suspendProcessInstance={suspendProcessInstance}
          formatDate={formatDate}
        />
      ),
    },
    {
      key: "2",
      label: "我的申请历史",
      children: (
        <ApplicationHistory
          loading={loading}
          applications={applications}
          applicationStatusFilter={applicationStatusFilter}
          applicationsPagination={applicationsPagination}
          userIdSearch={userIdSearch}
          setApplicationStatusFilter={setApplicationStatusFilter}
          setUserIdSearch={setUserIdSearch}
          setApplicationsPagination={setApplicationsPagination}
          loadLeaveApplications={loadLeaveApplications}
          viewApplication={viewApplication}
          formatDate={formatDate}
        />
      ),
    },
    {
      key: "3",
      label: "已完成任务",
      children: (
        <CompletedTasks
          processes={completedProcesses}
          selectedProcess={selectedProcess}
          tasks={completedTasks}
          loading={loading}
          tasksLoading={tasksLoading}
          error={error}
          setSelectedProcess={setSelectedProcess}
          loadCompletedProcesses={loadCompletedProcesses}
          loadCompletedTasks={loadCompletedTasks}
          formatDate={formatDate}
          formatDuration={formatDuration}
        />
      ),
    },
  ];

  // 流程执行轨迹模态框
  const ProcessDetailsModal = () => (
    <Modal
      title={`流程实例详情: ${
        currentProcessInstance?.businessKey || currentProcessInstance?.id
      }`}
      open={processDetailsModalVisible}
      onCancel={() => setProcessDetailsModalVisible(false)}
      width={800}
      footer={[
        <Button
          key="close"
          onClick={() => setProcessDetailsModalVisible(false)}
        >
          关闭
        </Button>,
      ]}
    >
      {currentProcessInstance && (
        <div>
          {/* 流程实例基本信息 */}
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="流程实例ID">
                {currentProcessInstance.id}
              </Descriptions.Item>
              <Descriptions.Item label="业务键">
                {currentProcessInstance.businessKey}
              </Descriptions.Item>
              <Descriptions.Item label="流程定义">
                {currentProcessInstance.processDefinitionName}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {currentProcessInstance.startUserId || "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {currentProcessInstance.startTime
                  ? formatDate(currentProcessInstance.startTime)
                  : "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {currentProcessInstance.endTime
                  ? formatDate(currentProcessInstance.endTime)
                  : "进行中"}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {currentProcessInstance.suspended ? (
                  <Tag color="error">已挂起</Tag>
                ) : currentProcessInstance.endTime ? (
                  <Tag color="success">已完成</Tag>
                ) : (
                  <Tag color="processing">进行中</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 流程变量信息 */}
          {currentProcessInstance.variables &&
            Object.keys(currentProcessInstance.variables).length > 0 && (
              <Card title="流程变量" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  {Object.entries(currentProcessInstance.variables).map(
                    ([key, value]) => (
                      <Descriptions.Item
                        key={key}
                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                      >
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : value}
                      </Descriptions.Item>
                    )
                  )}
                </Descriptions>
              </Card>
            )}

          {/* 流程执行轨迹 */}
          <Card title="流程执行轨迹" size="small">
            {executionPathLoading ? (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Spin tip="加载流程执行轨迹中..." />
              </div>
            ) : executionPaths.length === 0 ? (
              <Empty description="暂无流程执行轨迹数据" />
            ) : (
              <Timeline
                items={executionPaths.map((path) => ({
                  color: path.isActive ? "blue" : "gray",
                  children: (
                    <div
                      className={path.isActive ? "active-timeline-item" : ""}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        {getActivityIcon(path.type)}
                        <span style={{ marginLeft: 8, fontWeight: "bold" }}>
                          {path.activityName}
                        </span>
                        {path.isActive && (
                          <Badge
                            status="processing"
                            text="当前节点"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          marginLeft: 28,
                          fontSize: 12,
                          color: "#8c8c8c",
                        }}
                      >
                        <div>开始时间: {formatDate(path.startTime)}</div>
                        {path.endTime && (
                          <div>结束时间: {formatDate(path.endTime)}</div>
                        )}
                        {path.assignee && <div>处理人: {path.assignee}</div>}
                        {path.durationInMillis && (
                          <div>
                            处理时长: {formatDuration(path.durationInMillis)}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </div>
      )}
    </Modal>
  );

  return (
    <div className="process-management-page">
      <Title level={4} style={{ marginBottom: 16 }}>
        流程管理中心
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

      <Tabs defaultActiveKey="1" type="card" items={tabItems} />

      {/* 流程执行轨迹模态框 */}
      <ProcessDetailsModal />
    </div>
  );
};
