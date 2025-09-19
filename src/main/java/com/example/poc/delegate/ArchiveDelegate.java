package com.example.poc.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("archiveDelegate")
public class ArchiveDelegate implements JavaDelegate {

    private static final Logger log = LoggerFactory.getLogger(ArchiveDelegate.class);

    @Override
    public void execute(DelegateExecution execution) {
        String businessKey = execution.getProcessBusinessKey();
        log.info("Archiving leave application, businessKey={}", businessKey);
        execution.setVariable("archived", true);
    }
}


