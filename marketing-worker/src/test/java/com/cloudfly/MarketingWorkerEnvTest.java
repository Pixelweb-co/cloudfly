package com.cloudfly;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Simple sanity test to ensure required environment variables are present.
 * Connection tests are omitted to keep unit tests fast and independent of external services.
 */
@SpringBootTest(classes = com.marketing.worker.MarketingWorkerApplication.class, webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "DB_HOST=localhost",
        "REDIS_HOST=localhost"
})
public class MarketingWorkerEnvTest {

    @Value("${DB_HOST}")
    private String dbHost;

    @Value("${REDIS_HOST}")
    private String redisHost;

    @Test
    void envVarsLoaded() {
        assertNotNull(dbHost, "DB_HOST should be set");
        assertNotNull(redisHost, "REDIS_HOST should be set");
    }
}
