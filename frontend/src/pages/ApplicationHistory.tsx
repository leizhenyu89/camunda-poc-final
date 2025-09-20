import { useState } from 'react';
import { Table, Button, Input, Select, Tag, Space } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd';
import type { LeaveApplication } from '../api/leaveApi';

const { Option } = Select;

interface ApplicationHistoryProps {
  loading: boolean;
  applications: LeaveApplication[];
  applicationStatusFilter: string;
  applicationsPagination: TablePaginationConfig;
  userIdSearch: string;
  setApplicationStatusFilter: (value: string) => void;
  setUserIdSearch: (value: string) => void;
  setApplicationsPagination: (pagination: TablePaginationConfig) => void;
  loadLeaveApplications: () => void;
  viewApplication: (application: LeaveApplication) => void;
  formatDate: (dateString: string | Date) => string;
}

export const ApplicationHistory: React.FC<ApplicationHistoryProps> = ({
  loading,
  applications,
  applicationStatusFilter,
  applicationsPagination,
  userIdSearch,
  setApplicationStatusFilter,
  setUserIdSearch,
  setApplicationsPagination,
  loadLeaveApplications,
  viewApplication,
  formatDate
}) => {
  // 处理分页变化
  const handleApplicationsPaginationChange = (
    pagination: TablePaginationConfig
  ) => {
    setApplicationsPagination(pagination);
  };

  // 获取请假类型对应的中文名称
  const getLeaveTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      annual: "年假",
      sick: "病假",
      personal: "事假",
      marriage: "婚假",
      maternity: "产假/陪产假",
    };
    return typeMap[type] || type;
  };

  // 获取状态对应的中文名称和标签颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: "待审批", color: "processing" },
      approved: { text: "已批准", color: "success" },
      rejected: { text: "已拒绝", color: "error" },
      cancelled: { text: "已取消", color: "default" },
    };
    return statusMap[status] || { text: status, color: "default" };
  };

  // 请假申请表格列定义
  const applicationColumns: ColumnsType<LeaveApplication> = [
    {
      title: "申请单号",
      dataIndex: "businessKey",
      key: "businessKey",
      ellipsis: true,
    },
    {
      title: "请假类型",
      dataIndex: "leaveType",
      key: "leaveType",
      render: (type) => getLeaveTypeName(type),
    },
    {
      title: "请假时间",
      key: "leaveTime",
      render: (_, record) => `${record.startDate} 至 ${record.endDate}`,
    },
    {
      title: "提交时间",
      dataIndex: "submitTime",
      key: "submitTime",
      render: (time) => {
        return new Date(time).toLocaleString("zh-CN");
      },
    },
    {
      title: "状态",
      key: "status",
      render: (_, record) => {
        const statusInfo = getStatusInfo(record.status);
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
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
            onClick={() => viewApplication(record)}
          >
            查看
          </Button>
          {record.status === "pending" && (
            <Button type="link" danger disabled>
              取消
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
          <Input
            placeholder="输入用户ID搜索"
            value={userIdSearch}
            onChange={(e) => setUserIdSearch(e.target.value)}
            style={{ width: 200 }}
            suffix={
              <SearchOutlined
                style={{ cursor: 'pointer' }}
                onClick={loadLeaveApplications}
              />
            }
            onPressEnter={loadLeaveApplications}
          />
          <Select
            value={applicationStatusFilter}
            onChange={setApplicationStatusFilter}
            style={{ width: 120 }}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待审批</Option>
            <Option value="approved">已批准</Option>
            <Option value="rejected">已拒绝</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={loadLeaveApplications}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      <Table
        columns={applicationColumns}
        dataSource={applications}
        rowKey="id"
        loading={loading}
        pagination={applicationsPagination}
        onChange={handleApplicationsPaginationChange}
        locale={{
          emptyText: "暂无请假申请历史数据",
        }}
      />
    </>
  );
};