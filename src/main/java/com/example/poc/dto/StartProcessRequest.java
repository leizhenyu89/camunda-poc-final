package com.example.poc.dto;

import java.util.HashMap;
import java.util.Map;

/**
 * 启动流程实例的请求参数对象
 */
public class StartProcessRequest {
    
    // 流程定义key，默认值为"Process_034v92j"
    private String processDefinitionKey = "Process_034v92j";
    
    // 业务key
    private String businessKey;
    
    // 流程变量映射
    private Map<String, Object> variables = new HashMap<>();
    
    // getters and setters
    public String getProcessDefinitionKey() {
        return processDefinitionKey;
    }
    
    public void setProcessDefinitionKey(String processDefinitionKey) {
        this.processDefinitionKey = processDefinitionKey;
    }
    
    public String getBusinessKey() {
        return businessKey;
    }
    
    public void setBusinessKey(String businessKey) {
        this.businessKey = businessKey;
    }
    
    public Map<String, Object> getVariables() {
        return variables;
    }
    
    public void setVariables(Map<String, Object> variables) {
        this.variables = variables;
    }
}