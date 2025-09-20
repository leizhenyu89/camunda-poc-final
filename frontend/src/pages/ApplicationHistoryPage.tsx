import React, { useState, useEffect } from 'react';
import { ApplicationHistory } from './ApplicationHistory';
import { Spin, Alert } from 'antd';
import { leaveApi } from '../api/leaveApi';
import type { LeaveApplication } from '../api/leaveApi';
import type { TablePaginationConfig } from 'antd';

const ApplicationHistoryPage: React.FC = () => {
  // 状态定义
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [userIdSearch, setUserIdSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [applicationsPagination, setApplicationsPagination] = useState<TablePaginationConfig>({
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

  // 加载请假申请历史数据
  const loadLeaveApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveApi.getUserProcessInstances(userIdSearch);
      
      // 处理数据，构建LeaveApplication列表
      const leaveApplications: LeaveApplication[] = response.data.map((instance: any) => ({
        id: instance.id,
        businessKey: instance.businessKey || instance.id,
        leaveType: instance.variables?.leaveType || '未知',
        startDate: instance.variables?.startDate || '未知',
        endDate: instance.variables?.endDate || '未知',
        submitTime: instance.startTime,
        status: instance.variables?.status || (instance.endTime ? 'completed' : 'pending'),
      }));

      // 状态过滤
      let filteredApplications = [...leaveApplications];
      if (applicationStatusFilter !== 'all') {
        filteredApplications = filteredApplications.filter((app) => app.status === applicationStatusFilter);
      }

      // 分页处理
      const startIndex = (applicationsPagination.current! - 1) * applicationsPagination.pageSize!;
      const endIndex = startIndex + applicationsPagination.pageSize!;
      const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

      setApplications(paginatedApplications);
      setApplicationsPagination({...applicationsPagination, total: filteredApplications.length });
    } catch (err) {
      setError('加载请假申请历史失败');
      console.error('加载请假申请历史失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 查看请假申请详情
  const viewApplication = (application: LeaveApplication) => {
    console.log('查看请假申请详情:', application);
    // 这里可以实现打开详情模态框的逻辑
    alert(`查看请假申请: ${application.businessKey}`);
  };

  // 初始加载数据
  useEffect(() => {
    loadLeaveApplications();
  }, [applicationsPagination.current, applicationsPagination.pageSize]);

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 120px)' }}>
      <h1 style={{ marginBottom: 24 }}>申请历史</h1>
      
      {error && (
        <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={loading} tip="加载中...">
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
      </Spin>
    </div>
  );
};

export default ApplicationHistoryPage;