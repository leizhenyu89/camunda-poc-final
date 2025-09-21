export interface ProcessDefinition {
  /**
   * The unique identifier of the process definition.
   */
  id: string;

  /**
   * The name of the process definition.
   */
  name: string;

  /**
   * The version of the process definition.
   */
  version: number;

  /**
   * The key of the process definition.
   */
  key: string;

  /**
   * The deployment id of the process definition.
   * */
  deploymentId: string;
  
  /**
   * Whether the process definition is suspended.
   */
  suspended?: boolean;
  
  /**
   * The category of the process definition.
   */
  category?: string;
  
  /**
   * The description of the process definition.
   */
  description?: string;
  
  /**
   * The resource of the process definition.
   */
  resource?: string;

  resourceName?: string;
  
  /**
   * The diagram of the process definition.
   */
  diagram?: string;
  
  /**
   * The tenant id of the process definition.
   */
  tenantId?: string;
  
  /**
   * The version tag of the process definition.
   */
  versionTag?: string;
  
  /**
   * The history time to live of the process definition.
   */
  historyTimeToLive?: number;
  
  /**
   * Whether the process definition is startable in tasklist.
   */
  startableInTasklist?: boolean;
}


export interface ProcessInstance {

  startUserId?: string;
  /**
   * The unique identifier of the process instance.
   */
  id: string;

  /**
   * The business key of the process instance.
   */
  businessKey?: string;

  /**
   * The process definition id.
   */
  processDefinitionId: string;

  /**
   * The process definition key.
   */
  processDefinitionKey: string;

  /**
   * Whether the process instance is suspended.
   */
  suspended: boolean;
  
  /**
   * The tenant id of the process instance.
   */
  tenantId?: string;
  
  /**
   * 可选的开始时间 - 有些返回数据可能没有
   */
  startTime?: Date | string;
  
  /**
   * 可选的流程变量 - 有些返回数据可能没有
   */
  variables?: Record<string, any>;
  
  /**
   * 可选的结束时间 - 有些返回数据可能没有
   */
  endTime?: Date | string;

  status?: string;
}

// {
//             "id": "Process_034v92j:1:88b7b237-9569-11f0-a385-107c61bd2a1b",
//             "key": "Process_034v92j",
//             "category": "http://bpmn.io/schema/bpmn",
//             "description": null,
//             "name": "简洁请假流程",
//             "version": 1,
//             "resource": "C:\\Users\\xchwa\\Desktop\\camunda-poc-final\\target\\classes\\processes\\leave-process.bpmn",
//             "deploymentId": "889954c5-9569-11f0-a385-107c61bd2a1b",
//             "diagram": null,
//             "suspended": false,
//             "tenantId": null,
//             "versionTag": null,
//             "historyTimeToLive": null,
//             "startableInTasklist": false
//         }
