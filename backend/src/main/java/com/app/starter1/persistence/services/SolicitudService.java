package com.app.starter1.persistence.services;

import com.app.starter1.dto.SolicitudDTO;
import com.app.starter1.dto.SolicitudResponseDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SolicitudService {

    @Autowired
    private final SolicitudRepository solicitudRepository;
    @Autowired
    private final TypeServiceRepository typeServiceRepository;
    @Autowired
    private final CustomerRepository customerRepository;
    @Autowired
    private final ProductRepository productRepository;
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final EstadoSolicitudRepository estadoSolicitudRepository;
    @Autowired
    private final ReportRepository reportRepository;

    // Método para obtener todas las solicitudes y convertirlas en DTO de respuesta
    public List<SolicitudResponseDTO> getSolicitudes() {
        List<Solicitud> solicitudes = solicitudRepository.findAll();

        return solicitudes.stream()
                .map(solicitud -> SolicitudResponseDTO.builder()
                        .idSolicitud(solicitud.getIdSolicitud())
                        .fecha(solicitud.getFecha())
                        .hora(solicitud.getHora())
                        .descripcion(solicitud.getDescription())
                        .idTipoDevice(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductType() : null)
                        .idEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getId() : null)
                        .nombreEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductName() : null)
                        .nombreTipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getDescripcion() : null)
                        .nombreEntidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getName() : null)
                        .nombreEstadoSolicitud(solicitud.getStatus() != null ? solicitud.getStatus().getDescripcion() : null)
                        .asig(solicitud.getUsuarioAsignado() != null ? solicitud.getUsuarioAsignado() : null)
                        .status(solicitud.getStatus() != null ? solicitud.getStatus() : null)
                        .entidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getId() : null)
                        .tipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getId() : null)
                        .build())
                .toList();
    }

    // Lógica para obtener las solicitudes cerradas asociadas a un producto específico
    public List<SolicitudResponseDTO> getSolicitudesCerradasPorProducto(Long productId) {
        // Encuentra las solicitudes filtrando por producto y estado "FINALIZADA"
        List<Solicitud> solicitudesCerradas = solicitudRepository.findClosedRequestsByProductId(productId);


        return solicitudesCerradas.stream()
                .map(solicitud -> SolicitudResponseDTO.builder()
                        .idSolicitud(solicitud.getIdSolicitud())
                        .fecha(solicitud.getFecha())
                        .hora(solicitud.getHora())
                        .descripcion(solicitud.getDescription())
                        .idEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getId() : null)
                        .nombreEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductName() : null)
                        .nombreTipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getDescripcion() : null)
                        .nombreEntidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getName() : null)
                        .nombreEstadoSolicitud(solicitud.getStatus() != null ? solicitud.getStatus().getDescripcion() : null)
                        .status(solicitud.getStatus() != null ? solicitud.getStatus() : null)
                        .entidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getId() : null)
                        .tipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getId() : null)
                        .color(solicitud.getTypeService() != null ? solicitud.getTypeService().getColor() : null)
                        .reporte(reportRepository.findBySolicitud(solicitud.getIdSolicitud()))
                        .typeServiceServiceList(typeServiceRepository.findAll())
                        .customer(solicitud.getCustomer())
                        .equipo(solicitud.getEquipo())
                        .asig(solicitud.getUsuarioAsignado())
                        .build())
                .toList();
    }


    // Método para crear solicitudes a partir del DTO
    public List<Solicitud> createSolicitudes(SolicitudDTO solicitudDTO) {
        List<Solicitud> solicitudes = new ArrayList<>();

        // Logs de depuración
        System.out.println("Fecha: " + solicitudDTO.getFecha());
        System.out.println("Hora: " + solicitudDTO.getHora());
        System.out.println("Estado Solicitud ID: " + solicitudDTO.getStatus());
        System.out.println("Tipo Servicio ID: " + solicitudDTO.getTipoServicio());
        System.out.println("Entidad ID: " + solicitudDTO.getEntidad());
        System.out.println("Usuario Asignado ID: " + solicitudDTO.getAsig());
        System.out.println("Productos: " + solicitudDTO.getProductsToInsert());
        System.out.println("descripcion: " + solicitudDTO.getDescr());

        // Validar y buscar el usuario asignado si aplica
        UserEntity usuarioAsignado = null;
        if (solicitudDTO.getAsig() != null) {
            usuarioAsignado = userRepository.findById(Long.parseLong(solicitudDTO.getAsig()))
                    .orElseThrow(() -> new RuntimeException("Usuario asignado no encontrado"));
        }

        // Buscar el estado de la solicitud
        EstadoSolicitud estadoSolicitud = estadoSolicitudRepository.findById(solicitudDTO.getStatus())
                .orElseThrow(() -> new RuntimeException("Estado de solicitud no encontrado"));

        // Iterar sobre los productos a insertar
        for (Long productId : solicitudDTO.getProductsToInsert()) {
            // Validar y buscar el producto
            Product equipo = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Producto con ID " + productId + " no encontrado"));

            // Crear instancia de la solicitud
            Solicitud solicitud = Solicitud.builder()
                    .fecha(solicitudDTO.getFecha())
                    .hora(solicitudDTO.getHora())
                    .description(solicitudDTO.getDescr())
                    .equipo(equipo)
                    .status(estadoSolicitud)
                    .typeService(typeServiceRepository.findById(Long.parseLong(solicitudDTO.getTipoServicio()))
                            .orElseThrow(() -> new RuntimeException("Tipo de servicio no encontrado")))
                    .customer(customerRepository.findById(Long.parseLong(solicitudDTO.getEntidad()))
                            .orElseThrow(() -> new RuntimeException("Entidad no encontrada")))
                    .usuarioAsignado(usuarioAsignado)
                    .build();

            // Guardar solicitud y agregarla a la lista
            solicitudes.add(solicitudRepository.save(solicitud));
        }

        return solicitudes;
    }

    public List<SolicitudResponseDTO> getSolicitudesAbiertasPorUsuario(Long idUsuario) {
        // Obtener las solicitudes abiertas del usuario asignado
        List<Solicitud> solicitudes = solicitudRepository.findByUsuarioAsignadoIdAndStatusDescripcion(idUsuario, "ABIERTA");

        return solicitudes.stream()
                .map(solicitud -> SolicitudResponseDTO.builder()
                        .idSolicitud(solicitud.getIdSolicitud())
                        .fecha(solicitud.getFecha())
                        .hora(solicitud.getHora())
                        .descripcion(solicitud.getDescription())
                        .idEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getId() : null)
                        .nombreEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductName() : null)
                        .nombreTipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getDescripcion() : null)
                        .nombreEntidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getName() : null)
                        .nombreEstadoSolicitud(solicitud.getStatus() != null ? solicitud.getStatus().getDescripcion() : null)
                        .asig(solicitud.getUsuarioAsignado() != null ? solicitud.getUsuarioAsignado() : null)
                        .status(solicitud.getStatus() != null ? solicitud.getStatus() : null)
                        .entidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getId() : null)
                        .tipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getId() : null)
                        .build())
                .toList();
    }

    // Lógica para obtener las solicitudes abiertas para el usuario con fecha de hoy
    public List<SolicitudResponseDTO> getSolicitudesHoy(Long userId, String fechaHoy) {
        // Encuentra las solicitudes filtrando por usuario, estado "ABIERTA", y fecha
        List<Solicitud> solicitudes = solicitudRepository
                .findByUsuarioAsignadoIdAndStatusDescripcionAndFecha(userId, "ABIERTA", fechaHoy);

        return solicitudes.stream()
                .map(solicitud -> SolicitudResponseDTO.builder()
                        .idSolicitud(solicitud.getIdSolicitud())
                        .fecha(solicitud.getFecha())
                        .hora(solicitud.getHora())
                        .descripcion(solicitud.getDescription())
                        .idEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getId() : null)
                        .nombreEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductName() : null)
                        .nombreTipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getDescripcion() : null)
                        .nombreEntidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getName() : null)
                        .nombreEstadoSolicitud(solicitud.getStatus() != null ? solicitud.getStatus().getDescripcion() : null)
                        .asig(solicitud.getUsuarioAsignado() != null ? solicitud.getUsuarioAsignado() : null)
                        .status(solicitud.getStatus() != null ? solicitud.getStatus() : null)
                        .entidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getId() : null)
                        .tipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getId() : null)
                        .build())
                .toList();
    }

    public Solicitud getSolicitudWithDetails(Long idSolicitud) {
        // Buscar la solicitud por ID incluyendo las relaciones necesarias
        return solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud not found with id " + idSolicitud));
    }

    public Solicitud updateSolicitud(Long idSolicitud, SolicitudDTO solicitudDTO) {
        // Buscar la solicitud existente por su ID
        Solicitud solicitudExistente = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con ID " + idSolicitud));

        // Actualizar los campos de la solicitud con los valores del DTO
        if (solicitudDTO.getFecha() != null) {
            solicitudExistente.setFecha(solicitudDTO.getFecha());
        }
        if (solicitudDTO.getHora() != null) {
            solicitudExistente.setHora(solicitudDTO.getHora());
        }

        if(solicitudDTO.getDescr() != null){

            solicitudExistente.setDescription(solicitudDTO.getDescr());
        }

        // Actualizar el estado de la solicitud
        if (solicitudDTO.getStatus() != null) {
            EstadoSolicitud estadoSolicitud = estadoSolicitudRepository.findById(solicitudDTO.getStatus())
                    .orElseThrow(() -> new RuntimeException("Estado de solicitud no encontrado"));
            solicitudExistente.setStatus(estadoSolicitud);
        }

        // Actualizar el tipo de servicio
        if (solicitudDTO.getTipoServicio() != null) {
            TipoServicio tipoServicio = typeServiceRepository.findById(Long.parseLong(solicitudDTO.getTipoServicio()))
                    .orElseThrow(() -> new RuntimeException("Tipo de servicio no encontrado"));
            solicitudExistente.setTypeService(tipoServicio);
        }

        // Actualizar la entidad (cliente)
        if (solicitudDTO.getEntidad() != null) {
            Customer entidad = customerRepository.findById(Long.parseLong(solicitudDTO.getEntidad()))
                    .orElseThrow(() -> new RuntimeException("Entidad no encontrada"));
            solicitudExistente.setCustomer(entidad);
        }

        // Actualizar el usuario asignado
        if (solicitudDTO.getAsig() != null) {
            UserEntity usuarioAsignado = userRepository.findById(Long.parseLong(solicitudDTO.getAsig()))
                    .orElseThrow(() -> new RuntimeException("Usuario asignado no encontrado"));
            solicitudExistente.setUsuarioAsignado(usuarioAsignado);
        }

        // Actualizar el producto (equipo)
        if (solicitudDTO.getProductsToInsert() != null && !solicitudDTO.getProductsToInsert().isEmpty()) {
            Long productId = solicitudDTO.getProductsToInsert().get(0); // Suponiendo que solo hay un producto a actualizar
            Product equipo = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            solicitudExistente.setEquipo(equipo);
        }

        // Guardar la solicitud actualizada
        return solicitudRepository.save(solicitudExistente);
    }
    
    public Solicitud deleteSolicitud(Long idSolicitud) {
        // Buscar la solicitud por ID
        Solicitud solicitud = solicitudRepository.findById(idSolicitud)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con ID " + idSolicitud));       

        // Eliminar la solicitud
        solicitudRepository.delete(solicitud);

        return solicitud;
    }

    public List<MonthlyCount> getMonthlyCounts(int year){
        return solicitudRepository.countByMonth(year);
    }

    public List<SolicitudResponseDTO> getSolicitudesEnProcesoPorUsuario(Long idUsuario) {
        List<Solicitud> solicitudes = solicitudRepository.findByUsuarioAsignadoIdAndStatusDescripcion(idUsuario, "EN PROCESO");
        return solicitudes.stream()
                .map(solicitud -> SolicitudResponseDTO.builder()
                        .idSolicitud(solicitud.getIdSolicitud())
                        .fecha(solicitud.getFecha())
                        .hora(solicitud.getHora())
                        .descripcion(solicitud.getDescription())
                        .idEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getId() : null)
                        .nombreEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductName() : null)
                        .nombreTipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getDescripcion() : null)
                        .nombreEntidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getName() : null)
                        .nombreEstadoSolicitud(solicitud.getStatus() != null ? solicitud.getStatus().getDescripcion() : null)
                        .asig(solicitud.getUsuarioAsignado() != null ? solicitud.getUsuarioAsignado() : null)
                        .status(solicitud.getStatus() != null ? solicitud.getStatus() : null)
                        .entidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getId() : null)
                        .tipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getId() : null)
                        .build())
                .toList();
    }

    public List<SolicitudResponseDTO> getSolicitudesFinalizadasPorUsuario(Long idUsuario) {
        List<Solicitud> solicitudes = solicitudRepository.findByUsuarioAsignadoIdAndStatusDescripcion(idUsuario, "FINALIZADA");
        return solicitudes.stream()
                .map(solicitud -> SolicitudResponseDTO.builder()
                        .idSolicitud(solicitud.getIdSolicitud())
                        .fecha(solicitud.getFecha())
                        .hora(solicitud.getHora())
                        .descripcion(solicitud.getDescription())
                        .idEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getId() : null)
                        .nombreEquipo(solicitud.getEquipo() != null ? solicitud.getEquipo().getProductName() : null)
                        .nombreTipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getDescripcion() : null)
                        .nombreEntidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getName() : null)
                        .nombreEstadoSolicitud(solicitud.getStatus() != null ? solicitud.getStatus().getDescripcion() : null)
                        .asig(solicitud.getUsuarioAsignado() != null ? solicitud.getUsuarioAsignado() : null)
                        .status(solicitud.getStatus() != null ? solicitud.getStatus() : null)
                        .entidad(solicitud.getCustomer() != null ? solicitud.getCustomer().getId() : null)
                        .tipoServicio(solicitud.getTypeService() != null ? solicitud.getTypeService().getId() : null)
                        .build())
                .toList();
    }

    public List<StatusCount> getStatusCountsInMonth(int year, int month){
        return solicitudRepository.countByStatusInMonth(year, month);
    }
}
