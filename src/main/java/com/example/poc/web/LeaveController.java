package com.example.poc.web;

import com.example.poc.dto.ApplyLeaveRequest;
import com.example.poc.dto.CompleteTaskRequest;
import com.example.poc.dto.CompletedProcessQuery;
import com.example.poc.dto.StartProcessRequest;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.TaskService;
import org.camunda.bpm.engine.history.HistoricActivityInstance;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricTaskInstance;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.Execution;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.task.Task;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/leave")
public class LeaveController {

    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final HistoryService historyService;
    private final IdentityService identityService;

    public LeaveController(RuntimeService runtimeService,
                           TaskService taskService,
                           HistoryService historyService,
                           IdentityService identityService) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.historyService = historyService;
        this.identityService = identityService;
    }

    /**
     * 启动一个新的流程实例
     *
     * @param request 包含流程启动参数的请求对象，包括流程定义key、业务key和变量
     * @return 返回新启动的流程实例
     */
    @PostMapping("/start")
    public ResponseEntity<HistoricProcessInstance> start(@RequestBody StartProcessRequest request) {
        // 使用请求对象中的参数启动流程实例
        var instance = runtimeService.startProcessInstanceByKey(
                request.getProcessDefinitionKey(),
                request.getBusinessKey(),
                request.getVariables());
        // 直接返回流程实例
        return ResponseEntity.ok(getInstance(instance.getId()));
    }

    private HistoricProcessInstance getInstance(String instanceId) {
        return historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(instanceId)
                .singleResult();
    }

    /**
     * 请假申请
     *
     * @param request 包含申请相关数据的请求对象
     * @return 返回流程实例信息
     */
    @PostMapping("/apply")
    public ResponseEntity<HistoricTaskInstance> apply(@RequestBody ApplyLeaveRequest request) {
        // 创建变量Map，用于存储流程变量
        Map<String, Object> variables = getVariables(request);
        // 申请者作为流程创建用户
        String applicant = request.getApplicant();
        variables.put("startUserId", applicant);
        identityService.setAuthenticatedUserId(applicant);
        // 启动阶段设置的变量全程有效
        var instance = runtimeService.startProcessInstanceByKey(
                request.getProcessDefinitionKey(),
                request.getBusinessKey(),
                variables);
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        // 完成第一个用户任务
        Task task = taskService.createTaskQuery()
                .processInstanceId(instance.getId())
                .singleResult();
        // 验证申请人与处理人是否是同一个
        if (Objects.equals(applicant, task.getAssignee())) {
            taskService.complete(task.getId(), variables);
            return ResponseEntity.ok(getCompletedTask(task.getId()));
        }
        throw new IllegalCallerException("申请人与处理人不能是同一个人");
    }

    private static Map<String, Object> getVariables(ApplyLeaveRequest request) {
        Map<String, Object> variables = new HashMap<>();
        // 添加申请人变量
        if (request.getApplicant() != null) variables.put("applicant", request.getApplicant());
        // 添加审批人变量
        if (request.getManager() != null) variables.put("manager", request.getManager());
        // form fields
        if (request.getLeaveType() != null) variables.put("leaveType", request.getLeaveType());
        if (request.getStartTime() != null) variables.put("startTime", request.getStartTime());
        if (request.getEndTime() != null) variables.put("endTime", request.getEndTime());
        if (request.getReason() != null) variables.put("reason", request.getReason());
        if (request.getLeaveDays() != null) variables.put("leaveDays", request.getLeaveDays());
        return variables;
    }

    public HistoricTaskInstance getCompletedTask(String taskId) {
        return historyService.createHistoricTaskInstanceQuery()
                .taskId(taskId)
                .singleResult();
    }

    /**
     * 获取任务列表的REST接口
     *
     * @param assignee 可选参数，用于筛选特定负责人分配的任务
     * @return 返回任务列表
     */
    @GetMapping("/tasks/unfinished")
    public ResponseEntity<List<HistoricTaskInstance>> unFinishedTasks(@RequestParam(required = false, name = "assignee") String assignee) {
        return ResponseEntity.ok(historyService.createHistoricTaskInstanceQuery().taskAssignee(assignee).unfinished().list());
    }

    /**
     * 完成指定任务
     *
     * @param taskId  任务ID，从URL路径中获取
     * @param request 完成任务的请求对象，包含可能需要的变量参数
     * @return 返回204 NoContent响应，表示任务成功完成
     */
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(
            @PathVariable String taskId,
            @RequestBody(required = false) CompleteTaskRequest request) {
        // 获取当前任务
        Task task = taskService.createTaskQuery()
                .taskId(taskId)
                .singleResult();
        if (task == null) {
            return ResponseEntity.notFound().build();
        }
        // 准备变量
        Map<String, Object> variables = request == null ? new HashMap<>() : request.getVariables();
        // 检查是否是拒绝操作
        boolean isRejected = variables.containsKey("approved") && Boolean.FALSE.equals(variables.get("approved"));
        if (isRejected) {
            // 如果是拒绝，添加拒绝原因和结束流程的标志
            variables.put("rejected", true);
            variables.put("reason", variables.getOrDefault("reason", "未提供拒绝原因"));
            variables.put("endTime", new Date());
            // 完成当前任务
            taskService.complete(taskId, variables);
            // 终止流程实例
            if (!isProcessEnded(task.getProcessInstanceId())) {
                runtimeService.deleteProcessInstance(task.getProcessInstanceId(), "申请被拒绝");
            }
        } else {
            // 如果不是拒绝，正常完成任务
            taskService.complete(taskId, variables);
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * 检查流程是否已结束
     */
    public boolean isProcessEnded(String processInstanceId) {
        ProcessInstance processInstance = runtimeService.createProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .active()
                .singleResult();
        return processInstance == null;
    }


    /**
     * 获取已完成的流程实例列表
     * 支持按流程定义key和业务key进行筛选
     *
     * @param queryParam 查询条件对象，包含流程定义key和业务key（可选参数）
     * @return 返回已完成的流程实例列表
     */
    @GetMapping("/processes/completed")
    public ResponseEntity<List<HistoricProcessInstance>> completedProcesses(
            CompletedProcessQuery queryParam) {         // 查询参数对象
        // 创建历史流程实例查询，并筛选已完成的实例
        var query = historyService.createHistoricProcessInstanceQuery().finished();
        // 如果提供了流程定义key，则添加查询条件
        if (queryParam.getProcessDefinitionKey() != null && !queryParam.getProcessDefinitionKey().isBlank()) {
            query = query.processDefinitionKey(queryParam.getProcessDefinitionKey());
        }
        // 如果提供了业务key，则添加查询条件
        if (queryParam.getBusinessKey() != null && !queryParam.getBusinessKey().isBlank()) {
            query = query.processInstanceBusinessKey(queryParam.getBusinessKey());
        }
        // 按结束时间降序排序获取流程实例列表
        List<HistoricProcessInstance> instances = query.orderByProcessInstanceEndTime().desc().list();
        // 直接返回历史流程实例列表
        return ResponseEntity.ok(instances);
    }

    @GetMapping("/processes/{processInstanceId}/tasks/completed")
    public ResponseEntity<List<HistoricTaskInstance>> completedTasks(@PathVariable String processInstanceId) {
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(processInstanceId)
                .finished()
                .orderByHistoricTaskInstanceEndTime()
                .desc()
                .list();

        return ResponseEntity.ok(tasks);
    }

    /**
     * 获取流程实例的执行轨迹
     *
     * @param processInstanceId 流程实例ID
     * @return 返回按流程顺序展示的活动列表
     */
    @GetMapping("/processes/{processInstanceId}/execution-path")
    public ResponseEntity<List<Map<String, Object>>> getProcessExecutionPath(@PathVariable String processInstanceId) {
        // 获取流程实例的所有历史活动实例，按开始时间升序排序
        List<HistoricActivityInstance> historicActivities = historyService.createHistoricActivityInstanceQuery()
                .processInstanceId(processInstanceId)
                .orderPartiallyByOccurrence().asc()
                .list();

        // 获取当前正在执行的活动ID
        Set<String> activeActivityIds = new HashSet<>();

        // 尝试通过流程实例查询获取活跃活动ID
        try {
            List<ProcessInstance> processInstances = runtimeService.createProcessInstanceQuery()
                    .processInstanceId(processInstanceId)
                    .list();

            for (ProcessInstance instance : processInstances) {
                List<String> activeIds = runtimeService.getActiveActivityIds(instance.getId());
                if (activeIds != null && !activeIds.isEmpty()) {
                    activeActivityIds.addAll(activeIds);
                }
            }
        } catch (Exception e) {
            // 如果出错，尝试另一种方式
            log.warn("获取活跃活动ID失败: {}", e.getMessage());
        }

        // 如果上面的方式失败，尝试使用执行实例查询
        if (activeActivityIds.isEmpty()) {
            List<Execution> executions = runtimeService.createExecutionQuery()
                    .processInstanceId(processInstanceId)
                    .list();

            for (Execution execution : executions) {
                try {
                    // 尝试调用可能存在的方法
                    Method method = execution.getClass().getMethod("getCurrentActivityId");
                    Object result = method.invoke(execution);
                    if (result != null) {
                        activeActivityIds.add(result.toString());
                    }
                } catch (Exception e) {
                    // 忽略异常，继续尝试下一个执行实例
                }
            }
        }

        // 处理历史活动实例，构建执行轨迹
        List<Map<String, Object>> executionPath = historicActivities.stream()
                .map(activity -> {
                    Map<String, Object> activityInfo = new HashMap<>(getHistoricVariablesByExecutionId(activity.getExecutionId()));
                    activityInfo.put("id", activity.getId());
                    activityInfo.put("activityId", activity.getActivityId());
                    activityInfo.put("activityName", activity.getActivityName());
                    activityInfo.put("executionId", activity.getExecutionId());
                    activityInfo.put("processInstanceId", activity.getProcessInstanceId());
                    activityInfo.put("startTime", activity.getStartTime());
                    activityInfo.put("endTime", activity.getEndTime());
                    activityInfo.put("assignee", activity.getAssignee());

                    // 判断活动类型
                    String type = "task";
                    if (activity.getActivityType().contains("startEvent")) {
                        type = "start";
                    } else if (activity.getActivityType().contains("endEvent")) {
                        type = "end";
                    } else if (activity.getActivityType().contains("gateway")) {
                        type = "gateway";
                    }
                    activityInfo.put("type", type);

                    // 判断活动是否当前活跃
                    boolean isActive = activeActivityIds.contains(activity.getActivityId());
                    activityInfo.put("isActive", isActive);

                    // 如果是活跃的任务节点，获取当前任务信息
                    if (isActive && activity.getActivityType().contains("userTask")) {
                        try {
                            // 尝试查询当前流程实例的所有活跃任务
                            List<Task> tasks = taskService.createTaskQuery()
                                    .processInstanceId(processInstanceId)
                                    .active()
                                    .list();

                            if (tasks != null && !tasks.isEmpty()) {
                                // 查找匹配当前活动的任务
                                for (Task task : tasks) {
                                    if (task.getTaskDefinitionKey().equals(activity.getActivityId())) {
                                        activityInfo.put("assignee", task.getAssignee());
                                        break;
                                    }
                                }
                            }
                        } catch (Exception e) {
                            // 忽略查询异常
                        }
                    }

                    return activityInfo;
                })
                .collect(Collectors.toList());

        // 处理当前活跃的活动，确保按照流程顺序展示
        if (!activeActivityIds.isEmpty()) {
            // 找出那些尚未在历史活动中的活跃活动
            List<String> newActiveActivityIds = activeActivityIds.stream()
                    .filter(activityId -> executionPath.stream()
                            .noneMatch(activityInfo -> activityId.equals(activityInfo.get("activityId"))))
                    .collect(Collectors.toList());

            // 为新的活跃活动创建活动信息
            for (String activityId : newActiveActivityIds) {
                Map<String, Object> activityInfo = new HashMap<>();
                activityInfo.put("id", "execution-" + activityId);
                activityInfo.put("activityId", activityId);
                activityInfo.put("activityName", activityId); // 简单使用activityId作为名称
                activityInfo.put("executionId", "execution-" + activityId);
                activityInfo.put("processInstanceId", processInstanceId);
                activityInfo.put("startTime", new Date()); // 使用当前时间作为开始时间
                activityInfo.put("endTime", null);
                activityInfo.put("assignee", null);
                activityInfo.put("type", "task"); // 默认为任务类型
                activityInfo.put("isActive", true);

                // 尝试查询当前流程实例的所有活跃任务
                try {
                    List<Task> tasks = taskService.createTaskQuery()
                            .processInstanceId(processInstanceId)
                            .active()
                            .list();

                    if (tasks != null && !tasks.isEmpty()) {
                        // 查找匹配当前活动的任务
                        for (Task task : tasks) {
                            if (task.getTaskDefinitionKey().equals(activityId)) {
                                activityInfo.put("assignee", task.getAssignee());
                                break;
                            }
                        }
                    }
                } catch (Exception e) {
                    // 忽略查询异常
                }

                executionPath.add(activityInfo);
            }
        }

        // 确保最终结果按照流程顺序排序
        // 已完成活动按结束时间排序，活跃活动排在最后
        executionPath.sort((a, b) -> {
            Date endTimeA = (Date) a.get("endTime");
            Date endTimeB = (Date) b.get("endTime");

            // 如果两个活动都已完成，按结束时间排序
            if (endTimeA != null && endTimeB != null) {
                return endTimeA.compareTo(endTimeB);
            }
            // 如果一个已完成，一个活跃，已完成的排在前面
            if (endTimeA != null) {
                return -1;
            }
            if (endTimeB != null) {
                return 1;
            }
            // 如果两个都是活跃的，按活动ID排序（作为最后的排序标准）
            return ((String) a.get("activityId")).compareTo((String) b.get("activityId"));
        });

        return ResponseEntity.ok(executionPath);
    }


    /**
     * 2. 获取指定executionId的历史变量（包含已结束的流程，保留最新版本）
     * 历史变量：包含变量的全生命周期记录，此处取最新状态
     */
    public Map<String, Object> getHistoricVariablesByExecutionId(String executionId) {
        List<HistoricVariableInstance> variables = historyService
                .createHistoricVariableInstanceQuery()
                .executionIdIn(executionId)
                .list();

        // 转换为Map
        return variables.stream()
                .collect(Collectors.toMap(
                        HistoricVariableInstance::getName,
                        HistoricVariableInstance::getValue,
                        (existing, replacement) -> replacement // 处理重复（理论上不会出现）
                ));
    }
}


