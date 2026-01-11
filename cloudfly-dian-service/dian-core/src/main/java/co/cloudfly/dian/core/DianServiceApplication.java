package co.cloudfly.dian.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Clase principal del microservicio DIAN
 */
@SpringBootApplication(scanBasePackages = { "co.cloudfly.dian" })
@EnableKafka
@EnableAsync
public class DianServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DianServiceApplication.class, args);
    }
}
