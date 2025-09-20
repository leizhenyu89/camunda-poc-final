import React, { useState, useEffect } from 'react';
import { CompletedTasks } from './CompletedTasks';
import { Spin, Alert } from 'antd';
import { leaveApi } from '../api/leaveApi';
import type { CompletedProcess, CompletedTask } from '../api/leaveApi';

const CompletedTasksPage: React.FC = () => {
  // 状态定义
  const [processes, setProcesses] = useState<CompletedProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 格式化日期
  const formatDate = (dateString: string | Date): string => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch (error) {
      return '未知';
    }
  };

  // 格式化持续时间
  const formatDuration = (millis: number): string => {
    if (!millis) return '未知';
    
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天${hours % 24}小时`;
    }
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  // 加载已完成的流程列表
  const loadCompletedProcesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leaveApi.getCompletedProcesses();
      setProcesses(response);
      // 如果有流程，默认选择第一个
      if (response.length > 0 && !selectedProcess) {
        setSelectedProcess(response[0].id);
        loadCompletedTasks(response[0].id);
      }
    } catch (err) {
      setError('加载已完成的流程列表失败');
      console.error('加载已完成的流程列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载已完成的任务
  const loadCompletedTasks = async (processInstanceId: string) => {
    setTasksLoading(true);
    try {
      const response = await leaveApi.getCompletedTasks(processInstanceId);
      setTasks(response);
    } catch (err) {
      setError('加载已完成的任务失败');
      console.error('加载已完成的任务失败:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadCompletedProcesses();
  }, []);

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 120px)' }}>
      <h1 style={{ marginBottom: 24 }}>已完成任务</h1>
      
      <Spin spinning={loading} tip="加载中...">
        <CompletedTasks
          processes={processes}
          selectedProcess={selectedProcess}
          tasks={tasks}
          loading={loading}
          tasksLoading={tasksLoading}
          error={error}
          setSelectedProcess={setSelectedProcess}
          loadCompletedProcesses={loadCompletedProcesses}
          loadCompletedTasks={loadCompletedTasks}
          formatDate={formatDate}
          formatDuration={formatDuration}
        />
      </Spin>
    </div>
  );
};

export default CompletedTasksPage;