import React, { useState, useEffect } from 'react';
import { ProcessInstances } from './ProcessInstances';
import { Spin, Alert } from 'antd';
import { processApi } from '../api/processApi';
import type { ProcessInstance } from '../entity/ProcessDefinition';
import type { TablePaginationConfig } from 'antd';

const ProcessInstancesPage: React.FC = () => {
  // 状态定义
  const [loading, setLoading] = useState(false);
  const [processInstances, setProcessInstances] = useState<ProcessInstance[]>([]);
  const [searchKey, setSearchKey] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [instancesPagination, setInstancesPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  // 格式化日期
  const formatDate = (dateString: string | Date): string => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch (error) {
      return '未知';
    }
  };

  // 加载流程实例数据
  const loadProcessInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await processApi.getAllProcessInstances();
      
      // 过滤数据
      let filteredInstances = [...response.data];
      
      // 状态过滤
      if (statusFilter !== 'all') {
        filteredInstances = filteredInstances.filter((instance) => {
          if (statusFilter === 'active') {
            return !instance.endTime && !instance.suspended;
          }
          if (statusFilter === 'completed') {
            return !!instance.endTime;
          }
          return true;
        });
      }

      // 搜索过滤
      if (searchKey) {
        const lowerSearchKey = searchKey.toLowerCase();
        filteredInstances = filteredInstances.filter((instance) => {
          const instanceStr = (
            instance.id +
            (instance.businessKey || '') +
            (instance.variables?.employeeName || '') +
            (instance.variables?.applicant || '')
          ).toLowerCase();
          return instanceStr.includes(lowerSearchKey);
        });
      }

      // 分页处理
      const startIndex = (instancesPagination.current! - 1) * instancesPagination.pageSize!;
      const endIndex = startIndex + instancesPagination.pageSize!;
      const paginatedInstances = filteredInstances.slice(startIndex, endIndex);

      setProcessInstances(paginatedInstances);
      setInstancesPagination({...instancesPagination, total: filteredInstances.length });
    } catch (err) {
      setError('加载流程实例失败');
      console.error('加载流程实例失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 查看流程实例详情
  const viewProcessInstance = (instance: ProcessInstance) => {
    console.log('查看流程实例详情:', instance);
    // 这里可以实现打开详情模态框的逻辑
    alert(`查看流程实例: ${instance.id}`);
  };

  // 挂起流程实例
  const suspendProcessInstance = async (instance: ProcessInstance) => {
    try {
      await processApi.suspendProcessInstance(instance.id);
      // 重新加载数据
      loadProcessInstances();
    } catch (err) {
      setError('挂起流程实例失败');
      console.error('挂起流程实例失败:', err);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadProcessInstances();
  }, [instancesPagination.current, instancesPagination.pageSize]);

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 120px)' }}>
      <h1 style={{ marginBottom: 24 }}>流程实例管理</h1>
      
      {error && (
        <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={loading} tip="加载中...">
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
      </Spin>
    </div>
  );
};

export default ProcessInstancesPage;