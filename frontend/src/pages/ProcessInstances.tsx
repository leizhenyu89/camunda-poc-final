import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd';
import type { ProcessInstance } from '../entity/ProcessDefinition';

const { Search } = Input;
const { Option } = Select;

interface ProcessInstancesProps {
  loading: boolean;
  processInstances: ProcessInstance[];
  searchKey: string;
  statusFilter: string;
  instancesPagination: TablePaginationConfig;
  setSearchKey: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setInstancesPagination: (pagination: TablePaginationConfig) => void;
  loadProcessInstances: () => void;
  viewProcessInstance: (instance: ProcessInstance) => void;
  suspendProcessInstance: (instance: ProcessInstance) => void;
  formatDate: (dateString: string | Date) => string;
}

export const ProcessInstances: React.FC<ProcessInstancesProps> = ({
  loading,
  processInstances,
  searchKey,
  statusFilter,
  instancesPagination,
  setSearchKey,
  setStatusFilter,
  setInstancesPagination,
  loadProcessInstances,
  viewProcessInstance,
  suspendProcessInstance,
  formatDate
}) => {
  // 处理分页变化
  const handleInstancesPaginationChange = (
    pagination: TablePaginationConfig
  ) => {
    setInstancesPagination(pagination);
    loadProcessInstances();
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
      key: "startUserId",
      dataIndex: "startUserId",
      render: (startUserId) => startUserId || "未知",
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
        // 检查流程变量中是否有拒绝标志
        const hasRejection = record.status === 'rejected';
        return record.endTime ? (
          hasRejection ? (
            <Tag color="error">已拒绝</Tag>
          ) : (
            <Tag color="success">已完成</Tag>
          )
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

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="all">全部状态</Option>
            <Option value="active">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Search
            placeholder="搜索实例ID/业务键/申请人"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            style={{ width: 300 }}
            onChange={(e) => setSearchKey(e.target.value)}
            onSearch={() => loadProcessInstances()}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={loadProcessInstances}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      <Table
        columns={processInstanceColumns}
        dataSource={processInstances}
        rowKey="id"
        loading={loading}
        pagination={instancesPagination}
        onChange={handleInstancesPaginationChange}
        locale={{
          emptyText: "暂无流程实例数据",
        }}
      />
    </>
  );
};