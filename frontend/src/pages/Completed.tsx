import { useState, useEffect } from 'react';
import { leaveApi, CompletedProcess, CompletedTask } from '../api/leaveApi';

export function Completed() {
  const [processes, setProcesses] = useState<CompletedProcess[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProcesses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await leaveApi.getCompletedProcesses();
      setProcesses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '查询已结束流程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (processInstanceId: string) => {
    setTasksLoading(true);
    try {
      const data = await leaveApi.getCompletedTasks(processInstanceId);
      setTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '查询已完成任务失败');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleProcessClick = (processInstanceId: string) => {
    setSelectedProcess(processInstanceId);
    loadTasks(processInstanceId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatDuration = (millis: number) => {
    const hours = Math.floor(millis / (1000 * 60 * 60));
    const minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  return (
    <div className="page">
      <h2>已结束流程</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <button onClick={loadProcesses} className="btn" style={{ marginBottom: '1rem' }}>
        刷新流程列表
      </button>

      {loading && <div className="loading">加载中...</div>}

      {processes.length === 0 && !loading && (
        <div className="alert alert-success">
          暂无已结束的流程
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h3>已结束的流程</h3>
          {processes.map((process) => (
            <div 
              key={process.id} 
              className={`process-card ${selectedProcess === process.id ? 'selected' : ''}`}
              onClick={() => handleProcessClick(process.id)}
              style={{ cursor: 'pointer' }}
            >
              <h4>{process.businessKey || process.id}</h4>
              <p><strong>流程定义:</strong> {process.processDefinitionKey}</p>
              <p><strong>开始时间:</strong> {formatDate(process.startTime)}</p>
              <p><strong>结束时间:</strong> {formatDate(process.endTime)}</p>
              <p><strong>持续时间:</strong> {formatDuration(process.durationInMillis)}</p>
              <p><strong>结束原因:</strong> {process.deleteReason || '正常结束'}</p>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <h3>已完成的任务</h3>
          {selectedProcess ? (
            <>
              {tasksLoading && <div className="loading">加载任务中...</div>}
              {tasks.length === 0 && !tasksLoading && (
                <div className="alert alert-success">
                  该流程暂无已完成的任务
                </div>
              )}
              {tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <h4>{task.name}</h4>
                  <p><strong>任务ID:</strong> {task.id}</p>
                  <p><strong>处理人:</strong> {task.assignee || '系统'}</p>
                  <p><strong>开始时间:</strong> {formatDate(task.startTime)}</p>
                  <p><strong>结束时间:</strong> {formatDate(task.endTime)}</p>
                  <p><strong>处理时长:</strong> {formatDuration(task.durationInMillis)}</p>
                  <p><strong>结束原因:</strong> {task.deleteReason || '正常完成'}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="alert alert-success">
              请选择一个流程查看其已完成的任务
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
