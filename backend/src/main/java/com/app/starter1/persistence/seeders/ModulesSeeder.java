package com.app.starter1.persistence.seeders;

import com.app.starter1.persistence.entity.rbac.RbacModule;
import com.app.starter1.persistence.repository.rbac.RbacModuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ModulesSeeder implements CommandLineRunner {

    private final RbacModuleRepository moduleRepository;

    @Override
    public void run(String... args) throws Exception {
        if (moduleRepository.count() == 0) {
            log.info("Sembrando módulos por defecto...");
            seedModules();
            log.info("Módulos sembrados exitosamente.");
        } else {
            log.info("Los módulos ya existen, saltando siembra.");
        }
    }

    private void seedModules() {
        List<RbacModule> modules = List.of(
                // 1. Comunicaciones
                RbacModule.builder()
                        .code("COMUNICACIONES")
                        .name("Comunicaciones")
                        .description("Gestión de WhatsApp y chats")
                        .icon("tabler-message-circle")
                        .displayOrder(1)
                        .isActive(true)
                        .menuItems(
                                "[{\"label\":\"Chatbot IA WhatsApp\",\"href\":\"/settings/chatbot\"},{\"label\":\"Tipos de Chatbot\",\"href\":\"/settings/chatbot-types/list\",\"excludedRoles\":[\"VENDEDOR\",\"CONTABILIDAD\",\"MARKETING\"]},{\"label\":\"Conversaciones\",\"href\":\"/comunicaciones/conversaciones\"}]")
                        .build(),

                // 2. Marketing
                RbacModule.builder()
                        .code("MARKETING")
                        .name("Marketing")
                        .description("Campañas y Contactos")
                        .icon("tabler-speakerphone")
                        .displayOrder(2)
                        .isActive(true)
                        .menuItems(
                                "[{\"label\":\"Campañas\",\"href\":\"/marketing/campanas\"},{\"label\":\"Terceros\",\"href\":\"/marketing/contacts/list\"}]")
                        .build(),

                // 3. Calendario
                RbacModule.builder()
                        .code("CALENDARIO")
                        .name("Calendario")
                        .description("Gestión de agenda")
                        .icon("tabler-calendar")
                        .menuPath("/calendar")
                        .displayOrder(3)
                        .isActive(true)
                        .build(),

                // 4. Usuarios y Roles
                RbacModule.builder()
                        .code("USUARIOS_ROLES")
                        .name("Usuarios y Roles")
                        .description("Administración de accesos")
                        .icon("tabler-users")
                        .displayOrder(4)
                        .isActive(true)
                        .menuItems("[{\"label\":\"Gestión de Usuarios\",\"href\":\"/accounts/user/list\"}]")
                        .build(),

                // 5. Ventas
                RbacModule.builder()
                        .code("VENTAS")
                        .name("Ventas")
                        .description("Ciclo completo de ventas")
                        .icon("tabler-shopping-cart")
                        .displayOrder(5)
                        .isActive(true)
                        .menuItems(
                                "[{\"label\":\"Categorías\",\"href\":\"/ventas/categorias/list\"},{\"label\":\"Productos\",\"href\":\"/ventas/productos/list\"},{\"label\":\"Cotizaciones\",\"href\":\"/ventas/cotizaciones/list\"},{\"label\":\"Pedidos\",\"href\":\"/ventas/pedidos\"},{\"label\":\"Facturas\",\"href\":\"/ventas/facturas/list\"}]")
                        .build(),

                // 6. Recursos Humanos
                RbacModule.builder()
                        .code("RECURSOS_HUMANOS")
                        .name("Recursos Humanos")
                        .description("Nómina y Empleados")
                        .icon("tabler-users")
                        .displayOrder(6)
                        .isActive(true)
                        .menuItems(
                                "[{\"label\":\"Dashboard\",\"href\":\"/hr/dashboard\",\"icon\":\"tabler-chart-pie\"},{\"label\":\"Empleados\",\"href\":\"/hr/employees\"},{\"label\":\"Conceptos de Nómina\",\"href\":\"/hr/concepts\"},{\"label\":\"Novedades\",\"href\":\"/hr/novelties\"},{\"label\":\"Periodos\",\"href\":\"/hr/periods\"},{\"label\":\"Procesar Nómina\",\"href\":\"/hr/process\"},{\"label\":\"Recibos\",\"href\":\"/hr/receipts\"},{\"label\":\"Configuración\",\"href\":\"/hr/config\",\"excludedRoles\":[\"HR\"]}]")
                        .build(),

                // 7. Contabilidad
                RbacModule.builder()
                        .code("CONTABILIDAD")
                        .name("Contabilidad")
                        .description("Libros y Balances")
                        .icon("tabler-calculator")
                        .displayOrder(7)
                        .isActive(true)
                        .menuItems(
                                "[{\"label\":\"Plan de Cuentas\",\"href\":\"/contabilidad/plan-cuentas\"},{\"label\":\"Comprobantes\",\"href\":\"/contabilidad/comprobantes\"},{\"label\":\"Terceros\",\"href\":\"/contabilidad/terceros\"},{\"label\":\"Centros de Costo\",\"href\":\"/contabilidad/centros-costo\"},{\"label\":\"Balance de Prueba\",\"href\":\"/contabilidad/balance-prueba\"},{\"label\":\"Libro Diario\",\"href\":\"/contabilidad/libro-diario\"},{\"label\":\"Libro Mayor\",\"href\":\"/contabilidad/libro-mayor\"},{\"label\":\"Estado de Resultados\",\"href\":\"/contabilidad/estado-resultados\"},{\"label\":\"Balance General\",\"href\":\"/contabilidad/balance-general\"}]")
                        .build(),

                // 8. Administración
                RbacModule.builder()
                        .code("ADMINISTRACION")
                        .name("Administración")
                        .description("Configuraciones generales")
                        .icon("tabler-settings")
                        .displayOrder(8)
                        .isActive(true)
                        .menuItems(
                                "[{\"label\":\"Clientes\",\"href\":\"/administracion/clientes/list\"},{\"label\":\"Tipos de Chatbot\",\"href\":\"/settings/chatbot-types/list\"}]")
                        .build());

        moduleRepository.saveAll(modules);
    }
}
