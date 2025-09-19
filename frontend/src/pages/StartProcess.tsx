import { useState } from 'react';
import { leaveApi } from '../api/leaveApi';

export function StartProcess() {
  const [formData, setFormData] = useState({
    businessKey: '',
    applicant: '',
    manager: '',
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
      const response = await leaveApi.startProcess({
        businessKey: formData.businessKey || undefined,
        variables: {
          applicant: formData.applicant,
          manager: formData.manager,
        },
      });
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.message || '启动流程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="page">
      <h2>启动请假流程</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {result && (
        <div className="alert alert-success">
          <h3>流程启动成功！</h3>
          <p><strong>流程实例ID:</strong> {result.id}</p>
          <p><strong>业务键:</strong> {result.businessKey}</p>
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
            placeholder="例如: L-2024-0001"
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

        <button type="submit" className="btn" disabled={loading}>
          {loading ? '启动中...' : '启动流程'}
        </button>
      </form>
    </div>
  );
}
