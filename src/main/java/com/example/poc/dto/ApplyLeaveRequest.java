package com.example.poc.dto;

/**
 * 请假申请的请求参数对象
 */
public class ApplyLeaveRequest {
    
    // 流程定义key，默认值为"Process_034v92j"
    private String processDefinitionKey = "Process_034v92j";
    
    // 业务key
    private String businessKey;
    
    // 申请人
    private String applicant;
    
    // 审批人
    private String manager;
    
    // 请假类型
    private String leaveType;
    
    // 开始时间
    private String startTime;
    
    // 结束时间
    private String endTime;
    
    // 请假原因
    private String reason;
    
    // 请假天数
    private Integer leaveDays;
    
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
    
    public String getApplicant() {
        return applicant;
    }
    
    public void setApplicant(String applicant) {
        this.applicant = applicant;
    }
    
    public String getManager() {
        return manager;
    }
    
    public void setManager(String manager) {
        this.manager = manager;
    }
    
    public String getLeaveType() {
        return leaveType;
    }
    
    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }
    
    public String getStartTime() {
        return startTime;
    }
    
    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }
    
    public String getEndTime() {
        return endTime;
    }
    
    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public Integer getLeaveDays() {
        return leaveDays;
    }
    
    public void setLeaveDays(Integer leaveDays) {
        this.leaveDays = leaveDays;
    }
}