import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/leave';
const PROCESS_API_BASE_URL = 'http://localhost:8080/api/process-instances';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const processApi = axios.create({
  baseURL: PROCESS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProcessInstance {
  id: string;
  definitionId: string;
  businessKey: string;
}

// 流程执行轨迹接口
export interface ExecutionPath {
  id: string;
  activityId: string;
  activityName: string;
  executionId: string;
  processInstanceId: string;
  startTime: string;
  endTime?: string;
  assignee?: string;
  type: 'start' | 'task' | 'gateway' | 'end';
  isActive: boolean;
  variables?: Record<string, any>;
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
  reason?: string; // 拒绝原因
}

export interface LeaveApplication {
  id: string;
  businessKey: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitTime: string;
  approver?: string;
  approveTime?: string;
  comment?: string;
}

export const leaveApi = {
  // 启动流程
  startProcess: async (
    data: {
      businessKey?: string;
      variables?: Record<string, any>;
    }
  ) => {
    // 确保variables是对象类型，包含完整的申请者信息
    const processData = {
      ...data,
      variables: data.variables || {}
    };
    
    const response = await api.post('/start', processData);
    return response.data;
  },

  // 填写请假单
  applyLeave: async (
    data: {
      businessKey?: string;
      applicant: string;
      manager: string;
      leaveType: string;
      startTime: string;
      endTime: string;
      reason: string;
      leaveDays: number;
    }
  ) => {
    // 确保申请者信息完整且格式正确
    // 这里可以根据需要添加验证或转换逻辑
    const processData = {
      ...data,
      // 确保businessKey有值，以便更好地跟踪流程实例
      businessKey: data.businessKey || `LEAVE-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}`
    };
    
    const response = await api.post('/apply', processData);
    return response.data;
  },

  // 查询任务
  getTasks: async (assignee?: string) => {
    const params = assignee ? { assignee } : {};
    const response = await api.get('/tasks/unfinished', { params });
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
  
  // 获取请假申请历史
  getLeaveApplications: async (status?: string, applicant?: string) => {
    const params: any = {};
    if (status && status !== 'all') params.status = status;
    if (applicant) params.applicant = applicant;
    
    // 由于后端没有专门的接口，这里先获取已完成的流程和待处理的任务，组合成请假申请历史
    try {
      // 获取所有相关的流程和任务数据
      const [completedProcesses, pendingTasks] = await Promise.all([
        api.get('/processes/completed'),
        api.get('/tasks', { params: applicant ? { assignee: applicant } : {} })
      ]);
      
      // 处理数据并返回
      return { completedProcesses: completedProcesses.data, pendingTasks: pendingTasks.data };
    } catch (error) {
      // 如果API调用失败，返回模拟数据
      console.warn('获取请假申请历史失败，返回模拟数据:', error);
      return {
        completedProcesses: [],
        pendingTasks: []
      };
    }
  },
  
  // 获取用户的流程实例
  getUserProcessInstances: async (userId: string, params?: {
    processDefinitionKey?: string;
    businessKey?: string;
    activeOnly?: boolean;
    completedOnly?: boolean;
  }) => {
    const queryParams: any = { userId: userId };
    if (params?.processDefinitionKey) queryParams.processDefinitionKey = params.processDefinitionKey;
    if (params?.businessKey) queryParams.businessKey = params.businessKey;
    if (params?.activeOnly !== undefined) queryParams.activeOnly = params.activeOnly;
    if (params?.completedOnly !== undefined) queryParams.completedOnly = params.completedOnly;
    
    const response = await processApi.get('/by-user', { params: queryParams });
    return response.data;
  },
  
  // 获取流程执行轨迹
  getProcessExecutionPath: async (processInstanceId: string) => {
    const response = await api.get(`/processes/${processInstanceId}/execution-path`);
    return response.data;
  }
};
