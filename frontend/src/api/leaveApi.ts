import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/leave';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProcessInstance {
  id: string;
  definitionId: string;
  businessKey: string;
}

export interface Task {
  id: string;
  name: string;
  assignee: string;
  processInstanceId: string;
  processDefinitionId: string;
}

export interface CompletedProcess {
  id: string;
  businessKey: string;
  processDefinitionKey: string;
  startTime: string;
  endTime: string;
  durationInMillis: number;
  deleteReason: string;
}

export interface CompletedTask {
  id: string;
  name: string;
  assignee: string;
  startTime: string;
  endTime: string;
  durationInMillis: number;
  deleteReason: string;
}

export const leaveApi = {
  // 启动流程
  startProcess: async (data: {
    businessKey?: string;
    variables?: Record<string, any>;
  }) => {
    const response = await api.post('/start', data);
    return response.data;
  },

  // 填写请假单
  applyLeave: async (data: {
    businessKey?: string;
    applicant: string;
    manager: string;
    leaveType: string;
    startTime: string;
    endTime: string;
    reason: string;
    leaveDays: number;
  }) => {
    const response = await api.post('/apply', data);
    return response.data;
  },

  // 查询任务
  getTasks: async (assignee?: string) => {
    const params = assignee ? { assignee } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // 完成任务
  completeTask: async (taskId: string, variables?: Record<string, any>) => {
    const response = await api.post(`/tasks/${taskId}/complete`, variables || {});
    return response.data;
  },

  // 查询已结束的流程
  getCompletedProcesses: async (processDefinitionKey?: string, businessKey?: string) => {
    const params: any = {};
    if (processDefinitionKey) params.processDefinitionKey = processDefinitionKey;
    if (businessKey) params.businessKey = businessKey;
    
    const response = await api.get('/processes/completed', { params });
    return response.data;
  },

  // 查询流程的已完成任务
  getCompletedTasks: async (processInstanceId: string) => {
    const response = await api.get(`/processes/${processInstanceId}/tasks/completed`);
    return response.data;
  },
};
