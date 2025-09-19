import { useState } from 'react';
import { leaveApi } from '../api/leaveApi';

export function ApplyLeave() {
  const [formData, setFormData] = useState({
    businessKey: '',
    applicant: '',
    manager: '',
    leaveType: '事假',
    startTime: '',
    endTime: '',
    reason: '',
    leaveDays: 1,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await leaveApi.applyLeave(formData);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || '提交请假申请失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
    });
  };

  return (
    <div className="page">
      <h2>填写请假单</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <h3>请假申请提交成功！</h3>
          <p><strong>流程实例ID:</strong> {result.processInstanceId}</p>
          <p><strong>业务键:</strong> {result.businessKey}</p>
          <p>申请已自动提交，等待部门经理审批。</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="businessKey">业务键 (可选)</label>
          <input
            type="text"
            id="businessKey"
            name="businessKey"
            value={formData.businessKey}
            onChange={handleChange}
            placeholder="例如: L-2024-0002"
          />
        </div>

        <div className="form-group">
          <label htmlFor="applicant">申请人</label>
          <input
            type="text"
            id="applicant"
            name="applicant"
            value={formData.applicant}
            onChange={handleChange}
            required
            placeholder="例如: zhangsan"
          />
        </div>

        <div className="form-group">
          <label htmlFor="manager">部门经理</label>
          <input
            type="text"
            id="manager"
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            required
            placeholder="例如: lisi"
          />
        </div>

        <div className="form-group">
          <label htmlFor="leaveType">请假类型</label>
          <select
            id="leaveType"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            required
          >
            <option value="事假">事假</option>
            <option value="病假">病假</option>
            <option value="年假">年假</option>
            <option value="调休">调休</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startTime">开始时间</label>
          <input
            type="date"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">结束时间</label>
          <input
            type="date"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="leaveDays">请假天数</label>
          <input
            type="number"
            id="leaveDays"
            name="leaveDays"
            value={formData.leaveDays}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reason">请假原因</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            placeholder="请详细说明请假原因"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? '提交中...' : '提交请假申请'}
        </button>
      </form>
    </div>
  );
}
