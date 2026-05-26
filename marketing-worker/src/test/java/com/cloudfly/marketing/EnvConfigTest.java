package com.cloudfly.marketing;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.sql.Connection;
import java.sql.DriverManager;
import redis.clients.jedis.Jedis;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

public class EnvConfigTest {

    @Test
    void envVariablesLoaded() {
        String dbHost = System.getenv("DB_HOST");
        String dbUser = System.getenv("DB_USERNAME");
        String dbPass = System.getenv("DB_PASSWORD");
        String redisHost = System.getenv("REDIS_HOST");
        String redisPortStr = System.getenv("REDIS_PORT");
        assertNotNull(dbHost, "DB_HOST should be set");
        assertNotNull(dbUser, "DB_USERNAME should be set");
        assertNotNull(dbPass, "DB_PASSWORD should be set");
        assertNotNull(redisHost, "REDIS_HOST should be set");
        assertNotNull(redisPortStr, "REDIS_PORT should be set");
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "DB_HOST", matches = ".+")
    void canConnectToMySQL() throws Exception {
        String dbHost = System.getenv("DB_HOST");
        String dbUser = System.getenv("DB_USERNAME");
        String dbPass = System.getenv("DB_PASSWORD");
        String url = "jdbc:mysql://" + dbHost + ":3306/cloud_master";
        try (Connection conn = DriverManager.getConnection(url, dbUser, dbPass)) {
            assertTrue(conn.isValid(2), "MySQL connection should be valid");
        }
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "REDIS_HOST", matches = ".+")
    void canConnectToRedis() {
        String redisHost = System.getenv("REDIS_HOST");
        int redisPort = Integer.parseInt(System.getenv("REDIS_PORT"));
        String redisPass = System.getenv("REDIS_PASSWORD");
        try (Jedis jedis = new Jedis(redisHost, redisPort)) {
            if (redisPass != null && !redisPass.isEmpty()) {
                jedis.auth(redisPass);
            }
            assertEquals("PONG", jedis.ping(), "Redis should respond with PONG");
        }
    }
}
