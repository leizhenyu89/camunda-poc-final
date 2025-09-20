package com.example.poc.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.camunda.bpm.engine.impl.persistence.entity.ProcessInstanceWithVariablesImpl;
import org.camunda.bpm.engine.history.HistoricProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstance;

import java.util.Date;
import java.util.Map;

@Data
@NoArgsConstructor
public class ProcessInstanceDto {
    private String id;
    private String startUserId;
    private String processDefinitionId;
    private String processDefinitionKey;
    private String businessKey;
    private Date startTime;
    private Date endTime;
    private Long durationInMillis;
    private String deleteReason;
    private String status;
    private Map<String, Object> variables;

    // 从ProcessInstance创建DTO
    public ProcessInstanceDto(ProcessInstance processInstance) {
        this.id = processInstance.getId();
        this.processDefinitionId = processInstance.getProcessDefinitionId();
        this.businessKey = processInstance.getBusinessKey();
        
        // 从processDefinitionId中解析出processDefinitionKey
        if (processDefinitionId != null) {
            this.processDefinitionKey = processDefinitionId.split(":")[0];
        }

        // 如果是 ProcessInstanceWithVariablesImpl，获取变量
        if (processInstance instanceof ProcessInstanceWithVariablesImpl) {
            this.variables = ((ProcessInstanceWithVariablesImpl) processInstance).getVariables();
        }
    }
    
    // 从ProcessInstance和HistoricProcessInstance创建DTO
    public ProcessInstanceDto(ProcessInstance processInstance, HistoricProcessInstance historicInstance) {
        this(processInstance);
        if (historicInstance != null) {
            this.startTime = historicInstance.getStartTime();
        }
    }
    
    // 从HistoricProcessInstance创建DTO
    public ProcessInstanceDto(HistoricProcessInstance historicInstance) {
        this.id = historicInstance.getId();
        this.processDefinitionId = historicInstance.getProcessDefinitionId();
        this.processDefinitionKey = historicInstance.getProcessDefinitionKey();
        this.businessKey = historicInstance.getBusinessKey();
        this.startTime = historicInstance.getStartTime();
        this.endTime = historicInstance.getEndTime();
        this.durationInMillis = historicInstance.getDurationInMillis();
        this.deleteReason = historicInstance.getDeleteReason();
        this.startUserId = historicInstance.getStartUserId();
    }

}

