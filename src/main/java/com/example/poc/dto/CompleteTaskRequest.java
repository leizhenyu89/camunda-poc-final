package com.example.poc.dto;

import java.util.HashMap;
import java.util.Map;

/**
 * 完成任务的请求参数对象
 */
public class CompleteTaskRequest {
    
    // 完成任务时可能需要的变量参数
    private Map<String, Object> variables = new HashMap<>();
    
    // getters and setters
    public Map<String, Object> getVariables() {
        return variables;
    }
    
    public void setVariables(Map<String, Object> variables) {
        this.variables = variables;
    }
}