package com.example.poc.web;

import com.example.poc.dto.ProcessDefinitionDto;
import org.camunda.bpm.engine.RepositoryService;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.repository.Deployment;
import org.camunda.bpm.engine.repository.ProcessDefinition;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/process-definitions")
public class ProcessDefinitionController {

    @Autowired
    private RuntimeService runtimeService;
    
    @Autowired
    private RepositoryService repositoryService;

    /**
     * 获取流程定义列表
     * 
     * @param key 可选参数，用于按流程定义key筛选
     * @return 返回流程定义列表
     */
    @GetMapping
    public ResponseEntity<List<ProcessDefinitionDto>> getProcessDefinitions(@RequestParam(required = false) String key) {
        var query = repositoryService.createProcessDefinitionQuery().latestVersion();
        
        if (key != null && !key.isBlank()) {
            query = query.processDefinitionKey(key);
        }
        
        List<ProcessDefinition> processDefinitions = query.orderByProcessDefinitionName().asc().list();
        List<ProcessDefinitionDto> dtos = new ArrayList<>();
        for (ProcessDefinition processDefinition : processDefinitions) {
            // 获取部署信息
            Deployment deployment = repositoryService.createDeploymentQuery()
                    .deploymentId(processDefinition.getDeploymentId())
                    .singleResult();
            ProcessDefinitionDto dto = new ProcessDefinitionDto(processDefinition);
            dto.setDeploymentTime(deployment.getDeploymentTime());
            dtos.add(dto);
        }
        return ResponseEntity.ok(dtos);
    }
    
    /**
     * 获取流程实例列表
     * 
     * @param processDefinitionKey 可选参数，用于按流程定义key筛选
     * @param businessKey 可选参数，用于按业务key筛选
     * @return 返回流程实例列表
     */
    @GetMapping("/instances")
    public ResponseEntity<List<ProcessInstance>> getProcessInstances(
            @RequestParam(required = false) String processDefinitionKey,
            @RequestParam(required = false) String businessKey) {
        var query = runtimeService.createProcessInstanceQuery();
        
        if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
            query = query.processDefinitionKey(processDefinitionKey);
        }
        
        if (businessKey != null && !businessKey.isBlank()) {
            query = query.processInstanceBusinessKey(businessKey);
        }
        
        List<ProcessInstance> processInstances = query.orderByProcessInstanceId().desc().list();
        
        return ResponseEntity.ok(processInstances);
    }
    
    /**
     * 获取流程定义的BPMN XML内容
     * 
     * @param id 流程定义ID
     * @return 返回包含BPMN XML内容的对象
     */
    @GetMapping("/{id}/xml")
    public ResponseEntity<Map<String, String>> getProcessDefinitionXml(@PathVariable String id) throws IOException {
        byte[] processDefinitionXml = repositoryService.getProcessModel(id).readAllBytes();
        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("bpmn20Xml", new String(processDefinitionXml, StandardCharsets.UTF_8));
        return ResponseEntity.ok(responseBody);
    }
    
    /**
     * 获取流程定义的流程图
     * 
     * @param id 流程定义ID
     * @return 返回流程图（PNG格式）
     */
    @GetMapping("/{id}/diagram")
    public ResponseEntity<byte[]> getProcessDefinitionDiagram(@PathVariable String id) throws IOException {
        byte[] diagramBytes = repositoryService.getProcessDiagram(id).readAllBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .body(diagramBytes);
    }
}
