import type { ProcessDefinition, ProcessInstance } from '../entity/ProcessDefinition';

// 配置基础API URL
const BASE_URL = 'http://localhost:8080/api';

// 创建axios实例或使用fetch
const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 包含cookie
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`请求 ${url} 失败:`, error);
    throw error;
  }
};

// API方法
export const processApi = {
  // 获取流程定义列表
  getProcessDefinitions: async (
    key?: string,
    name?: string,
    category?: string,
    version?: number,
    suspended?: boolean,
    tenantId?: string
  ): Promise<ProcessDefinition[]> => {
    try {
      let url = `${BASE_URL}/process-definitions`;
      const params = new URLSearchParams();
      
      if (key) {
        params.append('key', encodeURIComponent(key));
      }
      
      if (name) {
        params.append('name', encodeURIComponent(name));
      }
      
      if (category) {
        params.append('category', encodeURIComponent(category));
      }
      
      if (version !== undefined) {
        params.append('version', version.toString());
      }
      
      if (suspended !== undefined) {
        params.append('suspended', suspended.toString());
      }
      
      if (tenantId) {
        params.append('tenantId', encodeURIComponent(tenantId));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiFetch<ProcessDefinition[]>(url);
      return response;
    } catch (error) {
      console.error('获取流程定义列表失败:', error);
      // 发生错误时返回空数组，避免页面崩溃
      return [];
    }
  },
  
  // 获取流程定义XML
  getProcessDefinitionXml: async (processDefinitionId: string): Promise<string> => {
    try {
      const url = `${BASE_URL}/process-definitions/${processDefinitionId}/xml`;
      const response = await apiFetch<{ bpmn20Xml: string }>(url);
      return response.bpmn20Xml;
    } catch (error) {
      console.error('获取流程定义XML失败:', error);
      throw error;
    }
  },
  
  // 获取流程定义流程图
  getProcessDefinitionDiagram: async (processDefinitionId: string): Promise<string> => {
    try {
      const url = `${BASE_URL}/process-definitions/${processDefinitionId}/diagram`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`获取流程图失败: ${response.status} ${response.statusText}`);
      }
      
      // 将流程图转换为Base64编码的字符串
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('获取流程定义流程图失败:', error);
      throw error;
    }
  },
  
  // 获取流程实例列表
  getProcessInstances: async (
    processDefinitionKey?: string,
    businessKey?: string
  ): Promise<ProcessInstance[]> => {
    try {
      let url = `${BASE_URL}/process-definitions/instances`;
      const params = new URLSearchParams();
      
      if (processDefinitionKey) {
        params.append('processDefinitionKey', processDefinitionKey);
      }
      
      if (businessKey) {
        params.append('businessKey', businessKey);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiFetch<{ data: ProcessInstance[] }>(url);
      // 转换时间格式
      return response.map(instance => ({
        ...instance,
        startTime: new Date(instance.startTime)
      }));
    } catch (error) {
      console.error('获取流程实例列表失败:', error);
      // 发生错误时返回空数组，避免页面崩溃
      return [];
    }
  },
  
  // 发起流程实例
  startProcessInstance: async (
    processDefinitionKey: string,
    businessKey?: string,
    variables?: Record<string, any>
  ): Promise<ProcessInstance> => {
    try {
      // 确保variables是对象类型
      const processVariables = variables || {};
      
      // 确保申请者信息存在于variables中
      // 如果没有明确提供employeeName但有其他申请者相关信息，可在这里处理
      
      const response = await apiFetch<ProcessInstance>(
        `${BASE_URL}/process-instances`,
        {
          method: 'POST',
          body: JSON.stringify({
            processDefinitionKey,
            businessKey,
            variables: processVariables,
          }),
        }
      );
      
      // 转换时间格式并确保返回的实例包含完整信息
      return {
        ...response,
        startTime: response.startTime ? new Date(response.startTime) : undefined,
        // 保留variables信息，确保申请者信息被正确记录
        variables: processVariables
      };
    } catch (error) {
      console.error('发起流程实例失败:', error);
      throw error;
    }
  },
  
  // 挂起/激活流程定义
  suspendProcessDefinition: async (
    processDefinitionId: string,
    suspend: boolean
  ): Promise<boolean> => {
    try {
      await apiFetch(
        `${BASE_URL}/process-definitions/${processDefinitionId}/${suspend ? 'suspend' : 'activate'}`,
        {
          method: 'POST',
        }
      );
      return true;
    } catch (error) {
      console.error(`${suspend ? '挂起' : '激活'}流程定义失败:`, error);
      throw error;
    }
  },
  
  // 挂起/激活流程实例
  suspendProcessInstance: async (
    processInstanceId: string,
    suspend: boolean
  ): Promise<boolean> => {
    try {
      await apiFetch(
        `${BASE_URL}/process-instances/${processInstanceId}/${suspend ? 'suspend' : 'activate'}`,
        {
          method: 'POST',
        }
      );
      return true;
    } catch (error) {
      console.error(`${suspend ? '挂起' : '激活'}流程实例失败:`, error);
      throw error;
    }
  },
  
  // 删除流程实例
  deleteProcessInstance: async (processInstanceId: string): Promise<boolean> => {
    try {
      await apiFetch(
        `${BASE_URL}/process-instances/${processInstanceId}`,
        {
          method: 'DELETE',
        }
      );
      return true;
    } catch (error) {
      console.error('删除流程实例失败:', error);
      throw error;
    }
  },

  // 获取所有流程实例（通过新的ProcessInstanceController）
  getAllProcessInstances: async (
    processDefinitionKey?: string,
    businessKey?: string,
    active?: boolean,
    completed?: boolean,
    page?: number,
    size?: number,
    sort?: string,
    order?: 'asc' | 'desc'
  ): Promise<{ total: number; data: ProcessInstance[] }> => {
    try {
      let url = `${BASE_URL}/process-instances`;
      const params = new URLSearchParams();
      
      if (processDefinitionKey) {
        params.append('processDefinitionKey', processDefinitionKey);
      }
      
      if (businessKey) {
        params.append('businessKey', businessKey);
      }
      
      if (active !== undefined) {
        params.append('active', active.toString());
      }
      
      if (completed !== undefined) {
        params.append('completed', completed.toString());
      }
      
      if (page !== undefined) {
        params.append('page', page.toString());
      }
      
      if (size !== undefined) {
        params.append('size', size.toString());
      }
      
      if (sort) {
        params.append('sort', sort);
      }
      
      if (order) {
        params.append('order', order);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiFetch<ProcessInstance[]>(url);
      
      // 转换时间格式
      return {
        total: response.length,
        data: response.map(instance => ({
          ...instance,
          startTime: instance.startTime ? new Date(instance.startTime) : undefined,
          endTime: instance.endTime ? new Date(instance.endTime) : undefined
        }))
      };
    } catch (error) {
      console.error('获取所有流程实例失败:', error);
      // 发生错误时返回空列表，避免页面崩溃
      return { total: 0, data: [] };
    }
  },
};