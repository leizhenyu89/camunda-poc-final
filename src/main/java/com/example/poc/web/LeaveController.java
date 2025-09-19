package com.example.poc.web;

import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.task.Task;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricTaskInstance;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leave")
public class LeaveController {

    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final HistoryService historyService;

    public LeaveController(RuntimeService runtimeService, TaskService taskService, HistoryService historyService) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.historyService = historyService;
    }

    /**
     * 启动一个新的流程实例
     *
     * @param body 包含流程启动参数的请求体，包括流程定义key、业务key和变量
     * @return 返回包含新启动流程实例信息的响应实体
     */
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start(@RequestBody Map<String, Object> body) {
        // 从请求体中获取流程定义key，如果未提供则使用默认值"Process_034v92j"
        String processDefinitionKey = (String) body.getOrDefault("processDefinitionKey", "Process_034v92j");
        // 从请求体中获取业务key，如果未提供则为null
        String businessKey = (String) body.getOrDefault("businessKey", null);
        // 从请求体中获取变量映射，如果未提供则使用空HashMap
        Map<String, Object> variables = (Map<String, Object>) body.getOrDefault("variables", new HashMap<>());
        // 使用运行时服务启动流程实例，传入流程定义key、业务key和变量
        var instance = runtimeService.startProcessInstanceByKey(processDefinitionKey, businessKey, variables);
        // 创建响应映射，包含新启动流程实例的相关信息
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", instance.getId());           // 流程实例ID
        resp.put("definitionId", instance.getProcessDefinitionId()); // 流程定义ID
        resp.put("businessKey", instance.getBusinessKey());        // 业务key
        // 返回包含流程实例信息的成功响应
        return ResponseEntity.ok(resp);
    }

    /**
     * 处理请假申请的接口方法
     *
     * @param body 包含申请相关数据的请求体
     * @return 返回包含流程实例ID和业务键的响应实体
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> apply(@RequestBody Map<String, Object> body) {
        // 获取流程定义的key，默认值为"Process_034v92j"
        String processDefinitionKey = (String) body.getOrDefault("processDefinitionKey", "Process_034v92j");
        // 获取业务key，可以为null
        String businessKey = (String) body.getOrDefault("businessKey", null);

        // 创建变量Map，用于存储流程变量
        Map<String, Object> variables = new HashMap<>();
        // 添加申请人变量
        if (body.containsKey("applicant")) variables.put("applicant", body.get("applicant"));
        // 添加审批人变量
        if (body.containsKey("manager")) variables.put("manager", body.get("manager"));

        // form fields
        if (body.containsKey("leaveType")) variables.put("leaveType", body.get("leaveType"));
        if (body.containsKey("startTime")) variables.put("startTime", body.get("startTime"));
        if (body.containsKey("endTime")) variables.put("endTime", body.get("endTime"));
        if (body.containsKey("reason")) variables.put("reason", body.get("reason"));
        if (body.containsKey("leaveDays")) variables.put("leaveDays", body.get("leaveDays"));

        var instance = runtimeService.startProcessInstanceByKey(processDefinitionKey, businessKey, variables);

        // complete the first user task: 填写请假单
        Task task = taskService.createTaskQuery()
                .processInstanceId(instance.getId())
                .singleResult();
        if (task != null) {
            // ensure assignee is applicant if provided
            Object applicant = variables.get("applicant");
            if (applicant instanceof String && (task.getAssignee() == null || task.getAssignee().isBlank())) {
                taskService.setAssignee(task.getId(), (String) applicant);
            }
            taskService.complete(task.getId(), variables);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("processInstanceId", instance.getId());
        resp.put("businessKey", instance.getBusinessKey());
        return ResponseEntity.ok(resp);
    }

    /**
     * 获取任务列表的REST接口
     *
     * @param assignee 可选参数，用于筛选特定负责人分配的任务
     * @return 返回包含任务信息的列表，每个任务以Map形式封装
     */
    @GetMapping("/tasks")
    public ResponseEntity<List<Map<String, Object>>> tasks(@RequestParam(required = false, name = "assignee") String assignee) {
        // 创建任务查询对象
        var query = taskService.createTaskQuery();
        // 如果提供了assignee参数且不为空字符串，则添加查询条件
        if (assignee != null && !assignee.isBlank()) {
            query = query.taskAssignee(assignee);
        }
        // 执行查询获取任务列表
        List<Task> tasks = query.list();
        // 将任务列表转换为包含指定字段的数据结构
        var data = tasks.stream().map(t -> {
            // 创建Map对象存储任务信息
            Map<String, Object> m = new HashMap<>();
            // 添加任务ID
            m.put("id", t.getId());
            // 添加任务名称
            m.put("name", t.getName());
            // 添加任务负责人
            m.put("assignee", t.getAssignee());
            // 添加流程实例ID
            m.put("processInstanceId", t.getProcessInstanceId());
            return m;
        }).toList();
        // 返回HTTP 200状态码和任务数据
        return ResponseEntity.ok(data);
    }

    /**
     * 完成指定任务的API接口
     *
     * @param taskId    任务ID，从URL路径中获取
     * @param variables 完成任务时可能需要的变量参数，通过请求体传递，可为空
     * @return 返回204 NoContent响应，表示任务成功完成
     */
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> complete(@PathVariable String taskId, @RequestBody(required = false) Map<String, Object> variables) {
        taskService.complete(taskId, variables == null ? new HashMap<>() : variables);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/processes/completed")
    public ResponseEntity<List<Map<String, Object>>> completedProcesses(
            @RequestParam(required = false) String processDefinitionKey,
            @RequestParam(required = false) String businessKey) {
        var query = historyService.createHistoricProcessInstanceQuery().finished();
        if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
            query = query.processDefinitionKey(processDefinitionKey);
        }
        if (businessKey != null && !businessKey.isBlank()) {
            query = query.processInstanceBusinessKey(businessKey);
        }
        List<HistoricProcessInstance> instances = query.orderByProcessInstanceEndTime().desc().list();
        var data = instances.stream().map(pi -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", pi.getId());
            m.put("businessKey", pi.getBusinessKey());
            m.put("processDefinitionKey", pi.getProcessDefinitionKey());
            m.put("startTime", pi.getStartTime());
            m.put("endTime", pi.getEndTime());
            m.put("durationInMillis", pi.getDurationInMillis());
            m.put("deleteReason", pi.getDeleteReason());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/processes/{processInstanceId}/tasks/completed")
    public ResponseEntity<List<Map<String, Object>>> completedTasks(@PathVariable String processInstanceId) {
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(processInstanceId)
                .finished()
                .orderByHistoricTaskInstanceEndTime()
                .desc()
                .list();
        var data = tasks.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("name", t.getName());
            m.put("assignee", t.getAssignee());
            m.put("startTime", t.getStartTime());
            m.put("endTime", t.getEndTime());
            m.put("durationInMillis", t.getDurationInMillis());
            m.put("deleteReason", t.getDeleteReason());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(data);
    }
}


