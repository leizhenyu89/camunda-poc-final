package com.example.poc.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.camunda.bpm.engine.repository.ProcessDefinition;

import java.util.Date;

@Data
@NoArgsConstructor
public class ProcessDefinitionDto {
    private String id;
    private String key;
    private String name;
    private int version;
    private String deploymentId;
    private String resourceName;
    private String diagramResourceName;
    private Date deploymentTime;

    public ProcessDefinitionDto(ProcessDefinition processDefinition) {
        this.id = processDefinition.getId();
        this.key = processDefinition.getKey();
        this.name = processDefinition.getName();
        this.version = processDefinition.getVersion();
        this.deploymentId = processDefinition.getDeploymentId();
        this.resourceName = processDefinition.getResourceName();
        this.diagramResourceName = processDefinition.getDiagramResourceName();
    }
}
