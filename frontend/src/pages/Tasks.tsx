import { useState, useEffect } from 'react';
import { leaveApi, Task } from '../api/leaveApi';

export function Tasks() {
  const [assignee, setAssignee] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await leaveApi.getTasks(assignee || undefined);
      setTasks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '查询任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId: string, approved: boolean) => {
    setApproving(taskId);
    try {
      await leaveApi.completeTask(taskId, { approved });
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err: any) {
      setError(err.response?.data?.message || '审批失败');
    } finally {
      setApproving(null);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="page">
      <h2>审批任务</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="assignee">审批人过滤 (可选)</label>
        <input
          type="text"
          id="assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="例如: lisi"
        />
        <button onClick={loadTasks} className="btn" style={{ marginTop: '0.5rem' }}>
          查询任务
        </button>
      </div>

      {loading && <div className="loading">加载中...</div>}

      {tasks.length === 0 && !loading && (
        <div className="alert alert-success">
          暂无待审批任务
        </div>
      )}

      {tasks.map((task) => (
        <div key={task.id} className="task-card">
          <h3>{task.name}</h3>
          <p><strong>任务ID:</strong> {task.id}</p>
          <p><strong>审批人:</strong> {task.assignee || '未分配'}</p>
          <p><strong>流程实例ID:</strong> {task.processInstanceId}</p>
          <p><strong>流程定义ID:</strong> {task.processDefinitionId}</p>
          
          <div className="task-actions">
            <button
              className="btn btn-success"
              onClick={() => handleApprove(task.id, true)}
              disabled={approving === task.id}
            >
              {approving === task.id ? '处理中...' : '同意'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleApprove(task.id, false)}
              disabled={approving === task.id}
            >
              {approving === task.id ? '处理中...' : '拒绝'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
