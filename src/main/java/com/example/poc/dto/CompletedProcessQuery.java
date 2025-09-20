package com.example.poc.dto;

/**
 * 查询已完成流程实例的请求参数对象
 */
public class CompletedProcessQuery {
    
    // 流程定义key（可选参数）
    private String processDefinitionKey;
    
    // 业务key（可选参数）
    private String businessKey;
    
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
}