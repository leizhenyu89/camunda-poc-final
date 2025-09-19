# Backend: Camunda 7 + Spring Boot 3 + MySQL

## 准备
- 安装 JDK 17+
- 安装 Maven 3.9+
- MySQL 建库：`CREATE DATABASE camunda_poc DEFAULT CHARACTER SET utf8mb4;`
- 修改 `src/main/resources/application.yml` 的数据库账号密码

## 启动
```bash
mvn spring-boot:run -DskipTests
```

Web Apps: `http://localhost:8080` 登录 `admin/admin`。

## API 示例
- 启动流程
```bash
curl -X POST http://localhost:8080/api/leave/start \
  -H "Content-Type: application/json" \
  -d '{
        "businessKey": "L-2024-0001",
        "variables": {"applicant": "zhangsan", "manager": "lisi"}
      }'
```
- 填写请假单（申请并自动完成第一个节点）
```bash
curl -X POST http://localhost:8080/api/leave/apply \
  -H "Content-Type: application/json" \
  -d '{
        "businessKey": "L-2024-0002",
        "applicant": "zhangsan",
        "manager": "lisi",
        "leaveType": "事假",
        "startTime": "2025-09-19",
        "endTime": "2025-09-20",
        "reason": "家中有事",
        "leaveDays": 2
      }'
```
- 审批（查询任务）
```bash
curl "http://localhost:8080/api/leave/tasks?assignee=lisi"
```
- 完成（经理审批）
```bash
curl -X POST http://localhost:8080/api/leave/tasks/{taskId}/complete \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```
- 查询已结束的流程
```bash
curl "http://localhost:8080/api/leave/processes/completed"
curl "http://localhost:8080/api/leave/processes/completed?processDefinitionKey=Process_034v92j&businessKey=L-2024-0001"
```
- 查询流程的已完成任务
```bash
curl "http://localhost:8080/api/leave/processes/{processInstanceId}/tasks/completed"
```

## 说明
- BPMN 位于 `src/main/resources/processes/leave-process.bpmn`，应用启动自动部署。
- 服务任务“人事归档”实现类：`com.example.poc.delegate.ArchiveDelegate`。
