package com.app.workflow.engine;

import com.app.persistence.entity.WorkflowEntity;
import com.app.persistence.entity.WorkflowExecutionLogEntity;
import com.app.persistence.repository.WorkflowExecutionLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkflowEngineExecutorTest {

    @Mock
    private WorkflowActionDispatcher actionDispatcher;

    @Mock
    private WorkflowExecutionLogRepository logRepository;

    private ObjectMapper objectMapper;
    private WorkflowEngineExecutor executor;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        executor = new WorkflowEngineExecutor(actionDispatcher, logRepository, objectMapper);
    }

    @Test
    public void testExecuteActionStep() {
        // Arrange
        String stepsJson = "{" +
                "  \"step_1\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"whatsapp.send_text\"," +
                "    \"actionParameters\": {" +
                "      \"phone\": \"{{data.customer.phone}}\"," +
                "      \"text_message\": \"Hello {{data.customer.name}}\"" +
                "    }," +
                "    \"nextStepId\": null" +
                "  }" +
                "}";

        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(1L)
                .tenantId(10L)
                .companyId(20L)
                .name("Test Workflow")
                .initialStepId("step_1")
                .workflowSteps(stepsJson)
                .build();

        Map<String, Object> payload = Map.of(
                "data", Map.of(
                        "customer", Map.of(
                                "name", "John Doe",
                                "phone", "123456"
                        )
                )
        );

        when(actionDispatcher.dispatch(eq("whatsapp.send_text"), eq(10L), eq(20L), anyMap(), anyMap()))
                .thenReturn(Mono.empty());

        // Act
        Mono<Void> result = executor.execute(workflow, payload);

        // Assert
        StepVerifier.create(result)
                .verifyComplete();

        ArgumentCaptor<Map> paramsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(actionDispatcher).dispatch(eq("whatsapp.send_text"), eq(10L), eq(20L), paramsCaptor.capture(), anyMap());
        assertEquals("{{data.customer.phone}}", paramsCaptor.getValue().get("phone"));
        assertEquals("Hello {{data.customer.name}}", paramsCaptor.getValue().get("text_message"));
    }

    @Test
    public void testExecuteIfStepConditionMet() {
        // Arrange
        String stepsJson = "{" +
                "  \"step_1\": {" +
                "    \"type\": \"IF\"," +
                "    \"condition\": {" +
                "      \"field\": \"data.order.total\"," +
                "      \"operator\": \"GREATER_THAN\"," +
                "      \"value\": 100.0" +
                "    }," +
                "    \"thenStepId\": \"step_then\"," +
                "    \"elseStepId\": \"step_else\"" +
                "  }," +
                "  \"step_then\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"crm.tag_contact\"," +
                "    \"actionParameters\": {" +
                "      \"tag_name\": \"VIP\"" +
                "    }," +
                "    \"nextStepId\": null" +
                "  }," +
                "  \"step_else\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"crm.tag_contact\"," +
                "    \"actionParameters\": {" +
                "      \"tag_name\": \"Normal\"" +
                "    }," +
                "    \"nextStepId\": null" +
                "  }" +
                "}";

        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(1L)
                .tenantId(10L)
                .companyId(20L)
                .name("Test Workflow")
                .initialStepId("step_1")
                .workflowSteps(stepsJson)
                .build();

        // 150.0 > 100.0 (Condition met)
        Map<String, Object> payload = Map.of(
                "data", Map.of(
                        "order", Map.of("total", 150.0)
                )
        );

        when(actionDispatcher.dispatch(eq("crm.tag_contact"), eq(10L), eq(20L), anyMap(), anyMap()))
                .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(executor.execute(workflow, payload))
                .verifyComplete();

        verify(actionDispatcher).dispatch(eq("crm.tag_contact"), eq(10L), eq(20L), argThat(map -> "VIP".equals(map.get("tag_name"))), anyMap());
        verify(actionDispatcher, never()).dispatch(eq("crm.tag_contact"), eq(10L), eq(20L), argThat(map -> "Normal".equals(map.get("tag_name"))), anyMap());
    }

    @Test
    public void testExecuteIfStepConditionNotMet() {
        // Arrange
        String stepsJson = "{" +
                "  \"step_1\": {" +
                "    \"type\": \"IF\"," +
                "    \"condition\": {" +
                "      \"field\": \"data.order.total\"," +
                "      \"operator\": \"GREATER_THAN\"," +
                "      \"value\": 100.0" +
                "    }," +
                "    \"thenStepId\": \"step_then\"," +
                "    \"elseStepId\": \"step_else\"" +
                "  }," +
                "  \"step_then\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"crm.tag_contact\"," +
                "    \"actionParameters\": {" +
                "      \"tag_name\": \"VIP\"" +
                "    }," +
                "    \"nextStepId\": null" +
                "  }," +
                "  \"step_else\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"crm.tag_contact\"," +
                "    \"actionParameters\": {" +
                "      \"tag_name\": \"Normal\"" +
                "    }," +
                "    \"nextStepId\": null" +
                "  }" +
                "}";

        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(1L)
                .tenantId(10L)
                .companyId(20L)
                .name("Test Workflow")
                .initialStepId("step_1")
                .workflowSteps(stepsJson)
                .build();

        // 50.0 > 100.0 (Condition NOT met)
        Map<String, Object> payload = Map.of(
                "data", Map.of(
                        "order", Map.of("total", 50.0)
                )
        );

        when(actionDispatcher.dispatch(eq("crm.tag_contact"), eq(10L), eq(20L), anyMap(), anyMap()))
                .thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(executor.execute(workflow, payload))
                .verifyComplete();

        verify(actionDispatcher).dispatch(eq("crm.tag_contact"), eq(10L), eq(20L), argThat(map -> "Normal".equals(map.get("tag_name"))), anyMap());
        verify(actionDispatcher, never()).dispatch(eq("crm.tag_contact"), eq(10L), eq(20L), argThat(map -> "VIP".equals(map.get("tag_name"))), anyMap());
    }

    @Test
    public void testExecuteSwitchStep() {
        // Arrange
        String stepsJson = "{" +
                "  \"step_1\": {" +
                "    \"type\": \"SWITCH\"," +
                "    \"field\": \"data.appointment.status\"," +
                "    \"cases\": {" +
                "      \"CONFIRMED\": \"step_confirmed\"," +
                "      \"CANCELLED\": \"step_cancelled\"" +
                "    }," +
                "    \"defaultStepId\": \"step_default\"" +
                "  }," +
                "  \"step_confirmed\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"whatsapp.send_text\"," +
                "    \"actionParameters\": {\"msg\": \"Confirmed\"}," +
                "    \"nextStepId\": null" +
                "  }," +
                "  \"step_cancelled\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"whatsapp.send_text\"," +
                "    \"actionParameters\": {\"msg\": \"Cancelled\"}," +
                "    \"nextStepId\": null" +
                "  }," +
                "  \"step_default\": {" +
                "    \"type\": \"ACTION\"," +
                "    \"actionCode\": \"whatsapp.send_text\"," +
                "    \"actionParameters\": {\"msg\": \"Default\"}," +
                "    \"nextStepId\": null" +
                "  }" +
                "}";

        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(1L)
                .tenantId(10L)
                .companyId(20L)
                .name("Test Workflow")
                .initialStepId("step_1")
                .workflowSteps(stepsJson)
                .build();

        Map<String, Object> payloadConfirmed = Map.of("data", Map.of("appointment", Map.of("status", "CONFIRMED")));
        Map<String, Object> payloadUnknown = Map.of("data", Map.of("appointment", Map.of("status", "PENDING")));

        when(actionDispatcher.dispatch(eq("whatsapp.send_text"), eq(10L), eq(20L), anyMap(), anyMap()))
                .thenReturn(Mono.empty());

        // Test CASE Match
        StepVerifier.create(executor.execute(workflow, payloadConfirmed))
                .verifyComplete();
        verify(actionDispatcher).dispatch(eq("whatsapp.send_text"), eq(10L), eq(20L), argThat(map -> "Confirmed".equals(map.get("msg"))), anyMap());

        // Test DEFAULT Match
        StepVerifier.create(executor.execute(workflow, payloadUnknown))
                .verifyComplete();
        verify(actionDispatcher).dispatch(eq("whatsapp.send_text"), eq(10L), eq(20L), argThat(map -> "Default".equals(map.get("msg"))), anyMap());
    }

    @Test
    public void testExecuteAndLogSuccess() {
        // Arrange
        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(5L)
                .tenantId(10L)
                .companyId(20L)
                .name("Logged Workflow")
                .initialStepId("step_1")
                .workflowSteps("{\"step_1\": {\"type\": \"ACTION\", \"actionCode\": \"some_action\", \"actionParameters\": {}, \"nextStepId\": null}}")
                .build();

        Map<String, Object> payload = Map.of("foo", "bar");

        when(actionDispatcher.dispatch(anyString(), anyLong(), anyLong(), anyMap(), anyMap()))
                .thenReturn(Mono.empty());
        when(logRepository.save(any(WorkflowExecutionLogEntity.class)))
                .thenReturn(Mono.just(new WorkflowExecutionLogEntity()));

        // Act
        Mono<Void> result = executor.executeAndLog(workflow, payload);

        // Assert
        StepVerifier.create(result)
                .verifyComplete();

        ArgumentCaptor<WorkflowExecutionLogEntity> logCaptor = ArgumentCaptor.forClass(WorkflowExecutionLogEntity.class);
        verify(logRepository).save(logCaptor.capture());
        WorkflowExecutionLogEntity savedLog = logCaptor.getValue();
        
        assertEquals(5L, savedLog.getWorkflowId());
        assertEquals(10L, savedLog.getTenantId());
        assertEquals(20L, savedLog.getCompanyId());
        assertEquals("SUCCESS", savedLog.getStatus());
        assertNotNull(savedLog.getExecutionTimeMs());
        assertNull(savedLog.getErrorMessage());
    }

    @Test
    public void testExecuteAndLogFailure() {
        // Arrange
        WorkflowEntity workflow = WorkflowEntity.builder()
                .id(5L)
                .tenantId(10L)
                .companyId(20L)
                .name("Logged Workflow")
                .initialStepId("step_1")
                .workflowSteps("{\"step_1\": {\"type\": \"ACTION\", \"actionCode\": \"failing_action\", \"actionParameters\": {}, \"nextStepId\": null}}")
                .build();

        Map<String, Object> payload = Map.of("foo", "bar");

        when(actionDispatcher.dispatch(anyString(), anyLong(), anyLong(), anyMap(), anyMap()))
                .thenReturn(Mono.error(new RuntimeException("Something failed!")));
        when(logRepository.save(any(WorkflowExecutionLogEntity.class)))
                .thenReturn(Mono.just(new WorkflowExecutionLogEntity()));

        // Act
        Mono<Void> result = executor.executeAndLog(workflow, payload);

        // Assert
        StepVerifier.create(result)
                .verifyComplete(); // Error is swallowed and logged in executeAndLog to keep consumers resilient

        ArgumentCaptor<WorkflowExecutionLogEntity> logCaptor = ArgumentCaptor.forClass(WorkflowExecutionLogEntity.class);
        verify(logRepository).save(logCaptor.capture());
        WorkflowExecutionLogEntity savedLog = logCaptor.getValue();
        
        assertEquals(5L, savedLog.getWorkflowId());
        assertEquals(10L, savedLog.getTenantId());
        assertEquals(20L, savedLog.getCompanyId());
        assertEquals("FAILED", savedLog.getStatus());
        assertNotNull(savedLog.getExecutionTimeMs());
        assertEquals("Something failed!", savedLog.getErrorMessage());
    }
}
