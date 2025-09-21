# Camunda 开发和使用文档

## 1. 项目概述

本项目是基于 Spring Boot 和 Camunda 开发的工作流管理系统，主要实现了请假流程的完整生命周期管理。系统采用前后端分离架构，后端提供 RESTful API，前端通过 React 实现用户界面。

### 主要功能特性

- 流程定义管理（部署、查询、获取流程图）
- 流程实例管理（启动、查询、终止）
- 任务管理（查询、认领、完成）
- 请假流程的完整实现
- 流程执行轨迹追踪
- 流程图可视化展示

## 2. 环境准备

### 2.1 开发环境要求

- JDK 17+ 
- Maven 3.9+ 
- MySQL 5.7+ 
- Node.js 14+ (前端开发)

### 2.2 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE camunda_poc DEFAULT CHARACTER SET utf8mb4;
```

2. 修改配置文件 `src/main/resources/application.yml` 中的数据库连接信息：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/camunda_poc?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root
    password: 123456
```

## 3. 项目结构

### 3.1 后端项目结构

```
src/main/java/com/example/poc/
├── CamundaPocApplication.java  # 应用程序入口
├── config/                     # 配置类
│   ├── CorsConfig.java         # 跨域配置
│   └── JacksonConfig.java      # JSON配置
├── delegate/                   # 服务任务实现
│   └── ArchiveDelegate.java    # 归档服务任务
├── dto/                        # 数据传输对象
│   ├── ApplyLeaveRequest.java  # 请假申请请求
│   └── ...
└── web/                        # REST控制器
    ├── LeaveController.java            # 请假流程相关接口
    ├── ProcessDefinitionController.java # 流程定义相关接口
    └── ProcessInstanceController.java  # 流程实例相关接口
```

### 3.2 前端项目结构

前端项目位于 `frontend/` 目录下，主要实现了流程定义、流程实例和任务的管理界面，并通过 bpmn-js 实现了流程图的可视化展示。

## 4. Camunda 核心概念

### 4.1 流程定义（Process Definition）

流程定义是工作流的蓝图，使用 BPMN 2.0 标准描述。在本项目中，流程定义文件位于 `src/main/resources/processes/` 目录下，应用启动时会自动部署。

### 4.2 流程实例（Process Instance）

流程实例是流程定义的一次执行实例，代表一个具体的业务流程实例。每个流程实例有唯一的 ID 和可选的业务键（businessKey）。

### 4.3 任务（Task）

任务是流程执行过程中需要用户或系统完成的工作项。在本项目中，主要是用户任务（User Task）需要人工处理。

### 4.4 服务任务（Service Task）

服务任务是流程中自动执行的任务，通常用于调用外部服务或执行特定业务逻辑。在本项目中，通过 JavaDelegate 接口实现。

## 5. 后端开发指南

### 5.1 流程定义开发

1. 使用 Camunda Modeler 或其他 BPMN 建模工具创建流程定义文件（.bpmn）
2. 将流程定义文件放置在 `src/main/resources/processes/` 目录下
3. 配置流程节点的属性，如任务名称、负责人表达式等
4. 对于服务任务，配置实现类的表达式，如 `${archiveDelegate}`

### 5.2 服务任务实现

服务任务通过实现 `org.camunda.bpm.engine.delegate.JavaDelegate` 接口来创建。示例代码：

```java
@Component("archiveDelegate")
public class ArchiveDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(ArchiveDelegate.class);

    @Override
    public void execute(DelegateExecution execution) {
        String businessKey = execution.getProcessBusinessKey();
        log.info("Archiving leave application, businessKey={}", businessKey);
        execution.setVariable("archived", true);
    }
}
```

**注意事项：**
- 需要使用 `@Component` 注解将实现类注册为 Spring Bean
- Bean 名称需要与 BPMN 文件中配置的表达式一致
- 可以通过 `DelegateExecution` 对象获取和设置流程变量

### 5.3 API 开发

Camunda 提供了丰富的 Java API，主要通过以下核心服务接口：

- **RuntimeService**: 管理流程实例的启动、暂停、恢复等
- **TaskService**: 管理任务的查询、认领、完成等
- **HistoryService**: 查询历史流程实例、任务等数据
- **RepositoryService**: 管理流程定义的部署、查询等

示例：启动流程实例

```java
ProcessInstance instance = runtimeService.startProcessInstanceByKey(
    processDefinitionKey, 
    businessKey, 
    variables
);
```

## 6. REST API 参考

### 6.1 流程定义接口

#### 获取流程定义列表
```
GET /api/process-definitions
```

#### 获取流程定义 XML
```
GET /api/process-definitions/{processDefinitionId}/xml
```

#### 获取流程图
```
GET /api/process-definitions/{processDefinitionId}/diagram
```

### 6.2 流程实例接口

#### 获取所有流程实例
```
GET /api/process-instances
```
参数：
- processDefinitionKey: 流程定义key
- businessKey: 业务key
- activeOnly: 是否只查询活跃实例
- completedOnly: 是否只查询已完成实例

#### 获取用户申请的流程实例
```
GET /api/process-instances/by-user
```
参数：
- userId: 用户ID
- 其他参数同上

### 6.3 请假流程接口

#### 启动流程
```
POST /api/leave/start
```
请求体：
```json
{
  "processDefinitionKey": "Process_034v92j",
  "businessKey": "L-2024-0001",
  "variables": {"applicant": "zhangsan", "manager": "lisi"}
}
```

#### 请假申请
```
POST /api/leave/apply
```
请求体：
```json
{
  "businessKey": "L-2024-0002",
  "applicant": "zhangsan",
  "manager": "lisi",
  "leaveType": "事假",
  "startTime": "2025-09-19",
  "endTime": "2025-09-20",
  "reason": "家中有事",
  "leaveDays": 2
}
```

#### 获取待办任务
```
GET /api/leave/tasks/unfinished?assignee={userId}
```

#### 完成任务
```
POST /api/leave/tasks/{taskId}/complete
```
请求体：
```json
{"approved": true, "reason": "同意请假"}
```

#### 获取流程执行轨迹
```
GET /api/leave/processes/{processInstanceId}/execution-path
```

## 7. 前端开发指南

### 7.1 项目启动

```bash
cd frontend
npm install
npm run dev
```
访问 `http://localhost:5173` 使用前端界面。

### 7.2 流程图展示

项目使用 bpmn-js 库实现流程图的可视化展示。主要实现步骤：

1. 导入必要的组件和样式
```javascript
import BpmnViewer from 'bpmn-js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
```

2. 创建 BpmnViewer 实例并渲染流程图
```javascript
const viewer = new BpmnViewer({
  container: '#bpmn-container',
  height: '100%',
  width: '100%'
});

async function renderBpmnDiagram(xml) {
  try {
    await viewer.importXML(xml);
    const canvas = viewer.get('canvas');
    canvas.zoom('fit-viewport');
  } catch (error) {
    console.error('Error rendering BPMN diagram:', error);
  }
}
```

## 8. Camunda Web页面

Camunda提供了内置的Web应用程序，包括Cockpit、Tasklist和Admin，这些应用程序可以帮助用户管理、监控和配置工作流。

### 8.1 访问Camunda Web页面

启动应用程序后，可以通过以下URL访问Camunda Web页面：

```
http://localhost:8080/camunda/app/
```

使用在`application.yml`中配置的管理员账号登录：
- 用户名：admin
- 密码：admin

### 8.2 Camunda Cockpit

Cockpit是Camunda的监控和管理工具，用于监控正在运行的流程实例、查看流程定义和分析性能。

主要功能：
- 监控正在运行的流程实例
- 查看流程定义的XML和图表
- 分析流程性能指标
- 查看任务和活动的状态
- 管理流程实例（暂停、恢复、取消）

访问地址：
```
http://localhost:8080/camunda/app/cockpit/
```

### 8.3 Camunda Tasklist

Tasklist是用户处理任务的界面，用户可以在这里查看、认领和完成分配给自己的任务。

主要功能：
- 查看分配给当前用户的任务列表
- 认领和完成任务
- 查看任务详情和表单
- 筛选和搜索任务
- 委托任务给其他用户

访问地址：
```
http://localhost:8080/camunda/app/tasklist/
```

### 8.4 Camunda Admin

Admin是Camunda的管理界面，用于管理用户、组和权限。

主要功能：
- 管理用户（创建、编辑、删除用户）
- 管理用户组
- 分配用户到组
- 配置授权规则
- 管理系统设置

访问地址：
```
http://localhost:8080/camunda/app/admin/
```

### 8.5 自定义Web应用与Camunda内置应用的区别

本项目同时提供了自定义的前端应用（React实现）和Camunda内置的Web应用：

- **自定义前端应用**：专为请假流程定制，提供更符合业务需求的用户界面和交互体验
- **Camunda内置应用**：提供更全面的工作流管理功能，包括监控、管理和配置等高级功能

在实际使用中，可以根据需要选择使用哪种界面。对于最终用户，通常使用自定义前端应用；对于管理员和开发人员，可以使用Camunda内置应用进行监控和管理。

## 9. 配置说明

### 9.1 Camunda 核心配置

在 `application.yml` 文件中，主要 Camunda 配置如下：

```yaml
camunda:
  history-level: full  # 历史记录级别
  bpm:
    database:
      type: mysql
      schema-update: true  # 自动更新数据库模式
    metrics:
      enabled: false  # 禁用指标收集
    generic-properties:
      properties:
        historyTimeToLive: P30D  # 历史数据保留30天
    admin-user:
      id: admin
      password: admin
      firstName: Admin
```

## 10. 常见问题及解决方案

### 10.1 流程部署问题

**问题：** 流程定义未自动部署
**解决方案：** 
- 确认 BPMN 文件放置在 `src/main/resources/processes/` 目录下
- 检查文件名后缀是否为 `.bpmn`
- 查看应用启动日志，确认部署信息

### 10.2 任务分配问题

**问题：** 任务未正确分配给指定用户
**解决方案：** 
- 检查 BPMN 文件中用户任务的 assignee 配置
- 确认流程变量传递正确
- 通过 TaskService 查询任务分配情况

### 10.3 流程图展示问题

**问题：** 流程图第二次打开显示空白
**解决方案：** 
- 确保每次打开流程图时正确销毁旧的 BpmnViewer 实例
- 使用 setTimeout 确保 DOM 更新后再渲染流程图
- 检查容器元素是否正确初始化

## 11. 部署与运行

### 11.1 后端部署

```bash
# 构建项目
mvn clean package

# 运行应用
java -jar target/camunda-poc-final-0.0.1-SNAPSHOT.jar
```

### 11.2 前端部署

```bash
cd frontend
npm install
npm run build
# 将 dist 目录部署到 Web 服务器
```

## 12. 开发最佳实践

1. **流程设计**
   - 保持流程逻辑清晰简洁
   - 合理使用网关控制流程分支
   - 为用户任务配置合适的表单

2. **变量管理**
   - 使用有意义的变量名称
   - 避免在流程中存储过多数据
   - 对于复杂数据，考虑使用外部存储

3. **异常处理**
   - 为服务任务添加异常边界事件
   - 实现全局错误处理机制
   - 记录详细的流程执行日志

4. **性能优化**
   - 合理设置历史记录级别
   - 定期清理历史数据
   - 优化流程查询语句

## 13. 附录

### 13.1 常用 Camunda API

- **启动流程实例**: `runtimeService.startProcessInstanceByKey()`
- **完成任务**: `taskService.complete()`
- **查询任务**: `taskService.createTaskQuery()`
- **查询流程实例**: `runtimeService.createProcessInstanceQuery()`
- **查询历史数据**: `historyService.createHistoricProcessInstanceQuery()`

### 13.2 参考资源

- [Camunda 官方文档](https://docs.camunda.org/manual/latest/)
- [BPMN 2.0 规范](https://www.omg.org/spec/BPMN/2.0/)
- [Spring Boot 集成指南](https://docs.camunda.org/manual/latest/user-guide/spring-boot-integration/)