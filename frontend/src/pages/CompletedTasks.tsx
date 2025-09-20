import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spin, Typography, Empty, Descriptions } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { CompletedProcess, CompletedTask } from '../api/leaveApi';

const { Title } = Typography;

interface CompletedTasksProps {
  processes: CompletedProcess[];
  selectedProcess: string | null;
  tasks: CompletedTask[];
  loading: boolean;
  tasksLoading: boolean;
  error: string | null;
  setSelectedProcess: (processId: string | null) => void;
  loadCompletedProcesses: () => void;
  loadCompletedTasks: (processInstanceId: string) => void;
  formatDate: (dateString: string | Date) => string;
  formatDuration: (millis: number) => string;
}

export const CompletedTasks: React.FC<CompletedTasksProps> = ({
  processes,
  selectedProcess,
  tasks,
  loading,
  tasksLoading,
  error,
  setSelectedProcess,
  loadCompletedProcesses,
  loadCompletedTasks,
  formatDate,
  formatDuration
}) => {
  // 处理流程点击
  const handleProcessClick = (processInstanceId: string) => {
    setSelectedProcess(processInstanceId);
    loadCompletedTasks(processInstanceId);
  };

  return (
    <>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={loadCompletedProcesses}
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        刷新流程列表
      </Button>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Card
            title="已结束的流程"
            size="small"
            className="process-card-container"
            extra={
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={loadCompletedProcesses}
                loading={loading}
              >
                刷新
              </Button>
            }
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <Spin tip="加载中..." size="large" />
              </div>
            ) : processes.length === 0 ? (
              <Empty description="暂无已结束的流程" />
            ) : (
              <div style={{ maxHeight: 600, overflowY: "auto" }}>
                {processes.map((process) => (
                  <Card
                    key={process.id}
                    className={
                      selectedProcess === process.id
                        ? "selected-process-card"
                        : ""
                    }
                    onClick={() => handleProcessClick(process.id)}
                    style={{
                      cursor: "pointer",
                      marginBottom: 12,
                      borderLeft:
                        selectedProcess === process.id
                          ? "4px solid #1890ff"
                          : "4px solid transparent",
                    }}
                    hoverable
                  >
                    <Title level={5} style={{ marginBottom: 12 }}>
                      {process.businessKey || process.id}
                    </Title>
                    <Descriptions
                      size="small"
                      column={1}
                      style={{ marginBottom: 0 }}
                    >
                      <Descriptions.Item label="流程定义">
                        {process.processDefinitionKey}
                      </Descriptions.Item>
                      <Descriptions.Item label="开始时间">
                        {formatDate(process.startTime)}
                      </Descriptions.Item>
                      <Descriptions.Item label="结束时间">
                        {formatDate(process.endTime)}
                      </Descriptions.Item>
                      <Descriptions.Item label="持续时间">
                        {formatDuration(process.durationInMillis)}
                      </Descriptions.Item>
                      <Descriptions.Item label="结束原因">
                        {process.deleteReason || "正常结束"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card
            title={`已完成的任务 (${selectedProcess || "未选择"})`}
            size="small"
            className="task-card-container"
          >
            {selectedProcess ? (
              <>
                {tasksLoading ? (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <Spin tip="加载任务中..." />
                  </div>
                ) : tasks.length === 0 ? (
                  <Empty description="该流程暂无已完成的任务" />
                ) : (
                  <div style={{ maxHeight: 600, overflowY: "auto" }}>
                    {tasks.map((task) => (
                      <Card
                        key={task.id}
                        style={{ marginBottom: 8 }}
                        size="small"
                      >
                        <Title level={5} style={{ marginBottom: 8 }}>
                          {task.name}
                        </Title>
                        <Descriptions size="small" column={1}>
                          <Descriptions.Item label="任务ID">
                            {task.id}
                          </Descriptions.Item>
                          <Descriptions.Item label="处理人">
                            {task.assignee || "系统"}
                          </Descriptions.Item>
                          <Descriptions.Item label="开始时间">
                            {formatDate(task.startTime)}
                          </Descriptions.Item>
                          <Descriptions.Item label="结束时间">
                            {formatDate(task.endTime)}
                          </Descriptions.Item>
                          <Descriptions.Item label="处理时长">
                            {formatDuration(task.durationInMillis)}
                          </Descriptions.Item>
                          <Descriptions.Item label="结束原因">
                            {task.reason ? "已拒绝" : "已通过"}
                          </Descriptions.Item>
                          {task.reason && (
                            <Descriptions.Item
                              label={
                                task.deleteReason?.includes("拒绝")
                                  ? "拒绝原因"
                                  : "审批意见"
                              }
                              style={
                                task.deleteReason?.includes("拒绝")
                                  ? { color: "#f5222d" }
                                  : { color: "#52c41a" }
                              }
                            >
                              {task.reason}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Empty description="请选择一个流程查看其已完成的任务" />
            )}
          </Card>
        </div>
      </div>
    </>
  );
};