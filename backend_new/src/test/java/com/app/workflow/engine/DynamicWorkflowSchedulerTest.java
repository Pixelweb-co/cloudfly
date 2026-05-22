package com.app.workflow.engine;

import com.app.persistence.entity.ContactEntity;
import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.repository.AppointmentRepository;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.WorkflowRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;
import java.util.concurrent.ScheduledFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DynamicWorkflowSchedulerTest {

    @Mock
    private TaskScheduler taskScheduler;

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private ContactRepository contactRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private WorkflowEngineExecutor workflowEngineExecutor;

    private ObjectMapper objectMapper;
    private DynamicWorkflowScheduler scheduler;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        scheduler = new DynamicWorkflowScheduler(
                taskScheduler,
                workflowRepository,
                contactRepository,
                appointmentRepository,
                workflowEngineExecutor,
                objectMapper
        );
    }

    @Test
    public void testScheduleWorkflowActiveCron() {
        // Arrange
        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(100L)
                .name("Cron Workflow")
                .triggerEvent("scheduler.cron")
                .cronExpression("0 0 12 * * ?")
                .isActive(true)
                .build();

        ScheduledFuture<?> mockFuture = mock(ScheduledFuture.class);
        doReturn(mockFuture).when(taskScheduler).schedule(any(Runnable.class), any(CronTrigger.class));

        // Act
        scheduler.scheduleWorkflow(workflow);

        // Assert
        assertTrue(scheduler.isWorkflowScheduled(100L));
        ArgumentCaptor<CronTrigger> triggerCaptor = ArgumentCaptor.forClass(CronTrigger.class);
        verify(taskScheduler).schedule(any(Runnable.class), triggerCaptor.capture());
        assertEquals("0 0 12 * * ?", triggerCaptor.getValue().getExpression());
    }

    @Test
    public void testScheduleWorkflowInactiveOrNotCron() {
        // Arrange
        WorkflowEntity workflowInactive = WorkflowEntity.builder()
                .id(101L)
                .name("Inactive Cron")
                .triggerEvent("scheduler.cron")
                .cronExpression("0 0 12 * * ?")
                .isActive(false)
                .build();

        WorkflowEntity workflowNotCron = WorkflowEntity.builder()
                .id(102L)
                .name("Kafka Event Workflow")
                .triggerEvent("order.paid")
                .isActive(true)
                .build();

        // Act
        scheduler.scheduleWorkflow(workflowInactive);
        scheduler.scheduleWorkflow(workflowNotCron);

        // Assert
        assertFalse(scheduler.isWorkflowScheduled(101L));
        assertFalse(scheduler.isWorkflowScheduled(102L));
        verify(taskScheduler, never()).schedule(any(Runnable.class), any(org.springframework.scheduling.Trigger.class));
    }

    @Test
    public void testCancelWorkflow() {
        // Arrange
        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(200L)
                .name("To Cancel")
                .triggerEvent("scheduler.cron")
                .cronExpression("0 0 12 * * ?")
                .isActive(true)
                .build();

        ScheduledFuture<?> mockFuture = mock(ScheduledFuture.class);
        doReturn(mockFuture).when(taskScheduler).schedule(any(Runnable.class), any(CronTrigger.class));

        scheduler.scheduleWorkflow(workflow);
        assertTrue(scheduler.isWorkflowScheduled(200L));

        // Act
        scheduler.cancelWorkflow(200L);

        // Assert
        assertFalse(scheduler.isWorkflowScheduled(200L));
        verify(mockFuture).cancel(true);
    }

    @Test
    public void testRunScheduledWorkflowContactsScope() {
        // Arrange
        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(300L)
                .tenantId(10L)
                .companyId(20L)
                .name("Batch Workflow")
                .triggerEvent("scheduler.cron")
                .cronExpression("*/5 * * * * *")
                .isActive(true)
                .workflowSteps("{\"scope\": \"contacts\", \"filter\": \"isActive = true\"}")
                .build();

        ContactEntity contact1 = ContactEntity.builder()
                .id(1L)
                .tenantId(10L)
                .companyId(20L)
                .name("Contact Active")
                .isActive(true)
                .phone("123456")
                .build();

        ContactEntity contact2 = ContactEntity.builder()
                .id(2L)
                .tenantId(10L)
                .companyId(20L)
                .name("Contact Inactive")
                .isActive(false)
                .phone("789012")
                .build();

        when(contactRepository.findByTenantIdAndCompanyId(10L, 20L))
                .thenReturn(Flux.just(contact1, contact2));
        
        when(workflowEngineExecutor.executeAndLog(eq(workflow), anyMap()))
                .thenReturn(Mono.empty());

        // Act
        Flux<Void> executionFlux = scheduler.runScheduledWorkflowFlux(workflow);

        // Assert
        StepVerifier.create(executionFlux)
                .verifyComplete();

        // Check that only active contact was executed due to "isActive = true" filter
        verify(workflowEngineExecutor, times(1)).executeAndLog(eq(workflow), argThat(payload -> {
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            ContactEntity c = (ContactEntity) data.get("contact");
            return c.getId().equals(1L);
        }));
        
        verify(workflowEngineExecutor, never()).executeAndLog(eq(workflow), argThat(payload -> {
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            ContactEntity c = (ContactEntity) data.get("contact");
            return c.getId().equals(2L);
        }));
    }
}
