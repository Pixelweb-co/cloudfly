package com.app.persistence.seeders;

import com.app.persistence.entity.GlobalAgent;
import com.app.persistence.repository.GlobalAgentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class GlobalAgentsSeeder implements CommandLineRunner {

    private final GlobalAgentRepository globalAgentRepository;

    @Override
    public void run(String... args) {
        globalAgentRepository.count()
                .flatMapMany(count -> {
                    if (count == 0) {
                        log.info("🌱 [SEEDER] Seeding Global AI Agents (Ventas, Soporte, Agendamiento)...");
                        return seedGlobalAgents();
                    } else {
                        log.info("⏭️ [SEEDER] Global Agents already exist, skipping.");
                        return Flux.empty();
                    }
                })
                .subscribe();
    }

    private Flux<GlobalAgent> seedGlobalAgents() {
        List<GlobalAgent> agents = List.of(
                GlobalAgent.builder()
                        .name("Ventas")
                        .code("VENTAS")
                        .basePrompt("Eres un experto en ventas y persuasión. Tu objetivo es cerrar tratos, manejar objeciones y guiar al cliente hacia la compra de forma amable y profesional.")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build(),
                GlobalAgent.builder()
                        .name("Soporte")
                        .code("SOPORTE")
                        .basePrompt("Eres un especialista en atención al cliente y soporte técnico. Tu objetivo es resolver dudas, ayudar con problemas y asegurar la satisfacción del cliente.")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build(),
                GlobalAgent.builder()
                        .name("Agendamiento")
                        .code("AGENDAMIENTO")
                        .basePrompt("Eres un asistente experto en gestión de agendas y citas. Tu objetivo es coordinar horarios, confirmar disponibilidades y agendar reuniones de forma eficiente.")
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        return globalAgentRepository.saveAll(agents);
    }
}
