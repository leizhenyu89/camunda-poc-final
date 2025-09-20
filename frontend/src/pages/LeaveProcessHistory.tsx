import React, { useState, useEffect } from 'react'
import { Table, Button, Select, Tag, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { leaveApi, type LeaveApplication } from '../api/leaveApi'

const { Option } = Select

const LeaveProcessHistory: React.FC = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `第${range[0]}-${range[1]}条，共${total}条`,
  })

  // 加载请假申请历史数据
  const loadLeaveApplications = async () => {
    setLoading(true)
    try {
      // 调用API获取请假申请历史
      const result = await leaveApi.getLeaveApplications(statusFilter);
      
      // 从API结果中构建请假申请列表
      const allApplications: LeaveApplication[] = [];
      
      // 处理待处理的任务（待审批状态）
      result.pendingTasks.forEach((task: any) => {
        // 这里是一个简化的映射，实际项目中可能需要从流程变量中获取更多信息
        const application: LeaveApplication = {
          id: `task-${task.id}`,
          businessKey: task.businessKey || `PENDING-${task.id.substring(0, 8)}`,
          leaveType: '年假', // 实际应该从流程变量中获取
          startDate: new Date().toISOString().split('T')[0], // 实际应该从流程变量中获取
          endDate: new Date().toISOString().split('T')[0], // 实际应该从流程变量中获取
          reason: '请假申请', // 实际应该从流程变量中获取
          status: 'pending',
          submitTime: new Date().toISOString(),
        };
        allApplications.push(application);
      });
      
      // 处理已完成的流程
      result.completedProcesses.forEach((process: any) => {
        // 这里是一个简化的映射，实际项目中可能需要从历史变量中获取更多信息
        let status: 'approved' | 'rejected' | 'cancelled' = 'approved';
        if (process.deleteReason && process.deleteReason.includes('拒绝')) {
          status = 'rejected';
        } else if (process.deleteReason && process.deleteReason.includes('取消')) {
          status = 'cancelled';
        }
        
        const application: LeaveApplication = {
          id: `process-${process.id}`,
          businessKey: process.businessKey || `COMPLETED-${process.id.substring(0, 8)}`,
          leaveType: '年假', // 实际应该从历史变量中获取
          startDate: process.startTime ? new Date(process.startTime).toISOString().split('T')[0] : '', // 格式化日期
          endDate: process.endTime ? new Date(process.endTime).toISOString().split('T')[0] : '', // 格式化日期
          reason: '已完成的请假申请', // 实际应该从历史变量中获取
          status: status,
          submitTime: process.startTime || new Date().toISOString(),
          approver: '系统', // 实际应该从历史任务中获取
          approveTime: process.endTime || new Date().toISOString(),
          comment: status === 'rejected' ? '申请未通过' : (status === 'cancelled' ? '申请已取消' : '申请已通过')
        };
        allApplications.push(application);
      });
      
      // 应用筛选条件
      let filteredApplications = [...allApplications];
      
      // 按状态筛选
      if (statusFilter !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === statusFilter)
      }
      
      // 按提交时间倒序排列
      filteredApplications.sort((a, b) => 
        new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()
      )
      
      setApplications(filteredApplications)
      // 更新分页信息
      setPagination(prev => ({ ...prev, total: filteredApplications.length }))
      message.success('请假申请历史加载成功')
    } catch (error) {
      console.error('加载请假申请历史失败:', error)
      message.error('加载请假申请历史失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看请假申请详情
  const viewApplication = (application: LeaveApplication) => {
    console.log('查看请假申请:', application)
    message.info('查看请假申请: ' + application.businessKey)
  }

  // 刷新请假申请历史
  const refreshApplications = () => {
    loadLeaveApplications()
  }

  // 处理分页变化
  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setPagination(pagination)
  }

  // 获取请假类型对应的中文名称
  const getLeaveTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'annual': '年假',
      'sick': '病假',
      'personal': '事假',
      'marriage': '婚假',
      'maternity': '产假/陪产假'
    }
    return typeMap[type] || type
  }

  // 获取状态对应的中文名称和标签颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      'pending': { text: '待审批', color: 'processing' },
      'approved': { text: '已批准', color: 'success' },
      'rejected': { text: '已拒绝', color: 'error' },
      'cancelled': { text: '已取消', color: 'default' }
    }
    return statusMap[status] || { text: status, color: 'default' }
  }

  // 表格列定义
  const columns: ColumnsType<LeaveApplication> = [
    {
      title: '申请单号',
      dataIndex: 'businessKey',
      key: 'businessKey',
      ellipsis: true,
    },
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => getLeaveTypeName(type),
    },
    {
      title: '请假时间',
      key: 'leaveTime',
      render: (_, record) => `${record.startDate} 至 ${record.endDate}`,
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      render: (time) => {
        return new Date(time).toLocaleString('zh-CN')
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const statusInfo = getStatusInfo(record.status)
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewApplication(record)}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              danger
              disabled
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 组件挂载时加载请假申请历史
  useEffect(() => {
    loadLeaveApplications()
  }, [statusFilter])

  return (
    <div className="table-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>我的请假申请历史</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
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
            onClick={refreshApplications}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={applications}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handlePaginationChange}
        locale={{
          emptyText: '暂无请假申请历史数据',
        }}
      />
    </div>
  )
}

export default LeaveProcessHistory