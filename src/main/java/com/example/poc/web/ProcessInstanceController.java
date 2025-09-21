package com.example.poc.web;

import com.example.poc.dto.ProcessInstanceDto;
import lombok.extern.slf4j.Slf4j;
import org.camunda.bpm.engine.HistoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.history.HistoricVariableInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/process-instances")
public class ProcessInstanceController {

    private final RuntimeService runtimeService;
    private final HistoryService historyService;

    public ProcessInstanceController(RuntimeService runtimeService, HistoryService historyService) {
        this.runtimeService = runtimeService;
        this.historyService = historyService;
    }

    /**
     * 获取所有流程实例（包括活跃的和已完成的）
     *
     * @param processDefinitionKey 可选参数，用于按流程定义key筛选
     * @param businessKey          可选参数，用于按业务key筛选
     * @param activeOnly           可选参数，是否只查询活跃的流程实例
     * @param completedOnly        可选参数，是否只查询已完成的流程实例
     * @return 返回流程实例列表
     */
    @GetMapping
    public ResponseEntity<List<ProcessInstanceDto>> getAllProcessInstances(
            @RequestParam(required = false, name = "processDefinitionKey") String processDefinitionKey,
            @RequestParam(required = false, name = "businessKey") String businessKey,
            @RequestParam(required = false, name = "activeOnly", defaultValue = "false") boolean activeOnly,
            @RequestParam(required = false, name = "completedOnly", defaultValue = "false") boolean completedOnly) {

        log.info("查询流程实例，参数：processDefinitionKey={}, businessKey={}, activeOnly={}, completedOnly={}",
                processDefinitionKey, businessKey, activeOnly, completedOnly);

        List<ProcessInstanceDto> result = new ArrayList<>();

        // 如果activeOnly和completedOnly都为false，则查询所有流程实例
        boolean queryAll = !activeOnly && !completedOnly;

        // 查询活跃的流程实例
        if (queryAll || activeOnly) {
            var runtimeQuery = runtimeService.createProcessInstanceQuery();

            if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
                runtimeQuery = runtimeQuery.processDefinitionKey(processDefinitionKey);
            }

            if (businessKey != null && !businessKey.isBlank()) {
                runtimeQuery = runtimeQuery.processInstanceBusinessKey(businessKey);
            }

            List<ProcessInstance> activeInstances = runtimeQuery.orderByProcessInstanceId().desc().list();

            // 将活跃的流程实例转换为ProcessInstanceDto并添加到结果列表
            activeInstances.forEach(instance -> {
                ProcessInstanceDto dto = mapProcessInstance(instance);
                dto.setStatus("active");
                dto.setStartUserId(getStartUser(instance.getId()));
                result.add(dto);
            });
        }

        // 查询已完成的流程实例
        if (queryAll || completedOnly) {
            var historyQuery = historyService.createHistoricProcessInstanceQuery().finished();

            if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
                historyQuery = historyQuery.processDefinitionKey(processDefinitionKey);
            }

            if (businessKey != null && !businessKey.isBlank()) {
                historyQuery = historyQuery.processInstanceBusinessKey(businessKey);
            }

            List<HistoricProcessInstance> completedInstances = historyQuery.orderByProcessInstanceEndTime().desc().list();

            // 将已完成的流程实例转换为ProcessInstanceDto并添加到结果列表
            completedInstances.forEach(instance -> {
                ProcessInstanceDto dto = mapHistoricProcessInstance(instance);
                Boolean approved = (Boolean) getVariableValueForCompletedInstance(instance.getId(), "approved");
                dto.setStatus(approved == Boolean.TRUE ? "completed" : "rejected");
                result.add(dto);
            });
        }

        // 按创建时间降序排序
        result.sort((a, b) -> {
            if (a.getStartTime() == null || b.getStartTime() == null) {
                return 0;
            }
            return b.getStartTime().compareTo(a.getStartTime());
        });

        log.info("查询到流程实例数量：{}", result.size());

        return ResponseEntity.ok(result);
    }

    public String getStartUser(String processInstanceId) {
        try {
            String startUserId = (String) runtimeService.getVariable(processInstanceId, "startUserId");
            if (startUserId != null) {
                return startUserId;
            }
        } catch (Exception e) {
            // 忽略异常，尝试其他方法
        }
        return "";
    }

    public Object getVariableValueForCompletedInstance(String processInstanceId, String variableName) {
        HistoricVariableInstance variable = historyService
                .createHistoricVariableInstanceQuery()
                .processInstanceId(processInstanceId)
                .variableName(variableName)
                .singleResult();
        return variable != null ? variable.getValue() : null;
    }

    /**
     * 将ProcessInstance对象转换为ProcessInstanceDto
     */
    private ProcessInstanceDto mapProcessInstance(ProcessInstance instance) {
        // 查询历史记录获取开始时间
        HistoricProcessInstance historicInstance = historyService.createHistoricProcessInstanceQuery()
                .processInstanceId(instance.getId())
                .singleResult();

        return new ProcessInstanceDto(instance, historicInstance);
    }

    /**
     * 将HistoricProcessInstance对象转换为ProcessInstanceDto
     */
    private ProcessInstanceDto mapHistoricProcessInstance(HistoricProcessInstance instance) {
        return new ProcessInstanceDto(instance);
    }

    /**
     * 查询个人申请的流程实例
     *
     * @param userId               用户ID，用于筛选该用户启动的流程实例
     * @param processDefinitionKey 可选参数，用于按流程定义key筛选
     * @param businessKey          可选参数，用于按业务key筛选
     * @param activeOnly           可选参数，是否只查询活跃的流程实例
     * @param completedOnly        可选参数，是否只查询已完成的流程实例
     * @return 返回用户申请的流程实例列表
     */
    @GetMapping("/by-user")
    public ResponseEntity<List<ProcessInstanceDto>> getProcessInstancesByUser(
            @RequestParam String userId,
            @RequestParam(required = false) String processDefinitionKey,
            @RequestParam(required = false) String businessKey,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @RequestParam(required = false, defaultValue = "false") boolean completedOnly) {

        log.info("查询用户申请的流程实例，参数：userId={}, processDefinitionKey={}, businessKey={}, activeOnly={}, completedOnly={}",
                userId, processDefinitionKey, businessKey, activeOnly, completedOnly);

        List<ProcessInstanceDto> result = new ArrayList<>();

        // 如果activeOnly和completedOnly都为false，则查询所有流程实例
        boolean queryAll = !activeOnly && !completedOnly;

        // 查询用户启动的活跃流程实例
        if (queryAll || activeOnly) {
            // 先查询历史记录获取用户启动的实例ID
            var userInstanceQuery = historyService.createHistoricProcessInstanceQuery()
                    .startedBy(userId)
                    .unfinished(); // 只查询未完成的

            if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
                userInstanceQuery = userInstanceQuery.processDefinitionKey(processDefinitionKey);
            }

            if (businessKey != null && !businessKey.isBlank()) {
                userInstanceQuery = userInstanceQuery.processInstanceBusinessKey(businessKey);
            }

            // 获取用户启动的活跃流程实例ID列表
            List<String> userActiveInstanceIds = userInstanceQuery
                    .list()
                    .stream()
                    .map(HistoricProcessInstance::getId)
                    .toList();

            // 根据ID列表查询活跃的流程实例
            if (!userActiveInstanceIds.isEmpty()) {
                var runtimeQuery = runtimeService.createProcessInstanceQuery()
                        .processInstanceIds(new HashSet<>(userActiveInstanceIds));

                List<ProcessInstance> activeInstances = runtimeQuery.orderByProcessInstanceId().desc().list();

                // 将活跃的流程实例转换为ProcessInstanceDto并添加到结果列表
                activeInstances.forEach(instance -> {
                    ProcessInstanceDto dto = mapProcessInstance(instance);
                    dto.setStatus("active");
                    result.add(dto);
                });
            }
        }

        // 查询用户启动的已完成流程实例
        if (queryAll || completedOnly) {
            var historyQuery = historyService.createHistoricProcessInstanceQuery()
                    .finished()
                    .startedBy(userId);

            if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
                historyQuery = historyQuery.processDefinitionKey(processDefinitionKey);
            }

            if (businessKey != null && !businessKey.isBlank()) {
                historyQuery = historyQuery.processInstanceBusinessKey(businessKey);
            }

            List<HistoricProcessInstance> completedInstances = historyQuery.orderByProcessInstanceEndTime().desc().list();

            // 将已完成的流程实例转换为ProcessInstanceDto并添加到结果列表
            completedInstances.forEach(instance -> {
                ProcessInstanceDto dto = mapHistoricProcessInstance(instance);
                dto.setStatus("completed");
                result.add(dto);
            });
        }

        // 按创建时间降序排序
        result.sort((a, b) -> {
            if (a.getStartTime() == null || b.getStartTime() == null) {
                return 0;
            }
            return b.getStartTime().compareTo(a.getStartTime());
        });

        log.info("查询到用户申请的流程实例数量：{}", result.size());

        return ResponseEntity.ok(result);
    }
}