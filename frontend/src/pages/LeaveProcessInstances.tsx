import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Tag, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd'
import { ReloadOutlined, SearchOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import type { ProcessInstance } from '../entity/ProcessDefinition'

const { Option } = Select
const { Search } = Input

const LeaveProcessInstances: React.FC = () => {
  const [processInstances, setProcessInstances] = useState<ProcessInstance[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKey, setSearchKey] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  })
  
  const location = useLocation()

  // 模拟加载流程实例数据
  const loadProcessInstances = async () => {
    setLoading(true)
    try {
      // 模拟API调用获取流程实例
      // 这里使用mock数据
      const mockProcessInstances: ProcessInstance[] = [
        {
          id: 'instance-1',
          processDefinitionId: 'leave-process:1:42',
          processDefinitionKey: 'leave-process',
          processDefinitionName: '请假流程',
          businessKey: 'LEAVE-2024-001',
          startTime: '2024-02-12T09:30:00Z',
          endTime: null,
          durationInMillis: null,
          startUserId: 'zhangsan',
          startActivityId: 'startEvent',
          superProcessInstanceId: null,
          suspended: false,
          tenantId: '',
          variables: {
            employeeName: '张三',
            leaveType: '年假',
            startDate: '2024-02-15',
            endDate: '2024-02-16',
            reason: '春节回家探亲',
          }
        },
        {
          id: 'instance-2',
          processDefinitionId: 'leave-process:1:42',
          processDefinitionKey: 'leave-process',
          processDefinitionName: '请假流程',
          businessKey: 'LEAVE-2024-002',
          startTime: '2024-02-10T14:15:00Z',
          endTime: '2024-02-12T10:45:00Z',
          durationInMillis: 151200000, // 42小时
          startUserId: 'lisi',
          startActivityId: 'startEvent',
          superProcessInstanceId: null,
          suspended: false,
          tenantId: '',
          variables: {
            employeeName: '李四',
            leaveType: '病假',
            startDate: '2024-02-13',
            endDate: '2024-02-14',
            reason: '感冒发烧需要休息',
          }
        },
        {
          id: 'instance-3',
          processDefinitionId: 'leave-process:1:42',
          processDefinitionKey: 'leave-process',
          processDefinitionName: '请假流程',
          businessKey: 'LEAVE-2024-003',
          startTime: '2024-02-11T16:20:00Z',
          endTime: null,
          durationInMillis: null,
          startUserId: 'wangwu',
          startActivityId: 'startEvent',
          superProcessInstanceId: null,
          suspended: false,
          tenantId: '',
          variables: {
            employeeName: '王五',
            leaveType: '事假',
            startDate: '2024-02-18',
            endDate: '2024-02-18',
            reason: '处理个人事务',
          }
        }
      ]
      
      // 应用筛选条件
      let filteredInstances = [...mockProcessInstances]
      
      // 按搜索关键词筛选
      if (searchKey) {
        filteredInstances = filteredInstances.filter(instance => 
          instance.id.includes(searchKey) ||
          instance.businessKey.includes(searchKey) ||
          (instance.variables?.employeeName && instance.variables.employeeName.includes(searchKey))
        )
      }
      
      // 按状态筛选
      if (statusFilter === 'active') {
        filteredInstances = filteredInstances.filter(instance => !instance.endTime)
      } else if (statusFilter === 'completed') {
        filteredInstances = filteredInstances.filter(instance => !!instance.endTime)
      }
      
      setProcessInstances(filteredInstances)
      // 更新分页信息
      setPagination(prev => ({ ...prev, total: filteredInstances.length }))
      message.success('流程实例加载成功')
    } catch (error) {
      console.error('加载流程实例失败:', error)
      message.error('加载流程实例失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看流程实例详情
  const viewProcessInstance = (instance: ProcessInstance) => {
    console.log('查看流程实例:', instance)
    message.info('查看流程实例: ' + instance.id)
  }

  // 挂起流程实例
  const suspendProcessInstance = (instance: ProcessInstance) => {
    console.log('挂起流程实例:', instance.id)
    message.success('流程实例已挂起')
    // 在实际应用中，这里会调用API来挂起流程实例
    // 然后刷新列表
  }

  // 刷新流程实例列表
  const refreshProcessInstances = () => {
    loadProcessInstances()
  }

  // 处理分页变化
  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setPagination(pagination)
  }

  // 表格列定义
  const columns: ColumnsType<ProcessInstance> = [
    {
      title: '业务键',
      dataIndex: 'businessKey',
      key: 'businessKey',
      ellipsis: true,
    },
    {
      title: '流程实例ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: '申请人',
      key: 'startUserId',
      render: (startUserId) => startUserId || '未知',
    },
    {
      title: '流程名称',
      dataIndex: 'processDefinitionName',
      key: 'processDefinitionName',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => {
        return new Date(time).toLocaleString('zh-CN')
      }
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => {
        return time ? new Date(time).toLocaleString('zh-CN') : '进行中'
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        if (record.suspended) {
          return <Tag color="error">已挂起</Tag>
        }
        return record.endTime ? (
          <Tag color="success">已完成</Tag>
        ) : (
          <Tag color="processing">进行中</Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
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
  ]

  // 组件挂载时加载流程实例
  useEffect(() => {
    loadProcessInstances()
  }, [searchKey, statusFilter, location.search])

  return (
    <div className="table-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>流程实例管理</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            onClick={refreshProcessInstances}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>
      
      <Table
        columns={columns}
        dataSource={processInstances}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handlePaginationChange}
        locale={{
          emptyText: '暂无流程实例数据',
        }}
      />
    </div>
  )
}

export default LeaveProcessInstances