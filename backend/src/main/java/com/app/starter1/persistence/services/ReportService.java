package com.app.starter1.persistence.services;

import com.app.starter1.dto.PlantillaDTO;
import com.app.starter1.dto.PlantillaVerificationDTO;
import com.app.starter1.dto.ReportDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private CheckeoRepository checkeoRepository;

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Autowired
    private EstadoSolicitudRepository estadoSolicitudRepository;

    @Autowired
    private VerificationRepository verificationRepository;

    /**
     * Crear o guardar un reporte.
     *
     * @param reportDTO Datos del reporte.
     * @return Reporte guardado.
     */
    public Reporte save(ReportDTO reportDTO) {
        Reporte reporte = mapToEntity(reportDTO);
        Reporte savedReport = reportRepository.save(reporte);


        // Guardar los checkeos
        if (reportDTO.getPlantillas() != null) {
            for (PlantillaDTO plantilla : reportDTO.getPlantillas()) {
                Checkeo checkeo = new Checkeo();
                checkeo.setNombre(plantilla.getNom()); // Aquí se pueden usar otros campos si es necesario
                checkeo.setValor(plantilla.getValor());
                // Obtener la fecha y hora actual y formatearla en el formato 'YYYY-MM-DD | H:M:S'
                String formattedDateTime = LocalDateTime.now()
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd | HH:mm:ss"));
                checkeo.setDateTime(formattedDateTime); // Asignamos la fecha formateada
                checkeo.setIdOrden(savedReport.getSolicitud()); // Relacionamos el checkeo con el reporte creado
                checkeoRepository.save(checkeo);
            }
        }

        // Guardar los checkeos
        if (reportDTO.getVtemplatesData() != null) {
            for (PlantillaVerificationDTO plantillaV : reportDTO.getVtemplatesData()) {
                PlantillaVerificacionData pverification = new PlantillaVerificacionData();

                pverification.setIdPlantilla(plantillaV.getId_plantilla());
                pverification.setEquipment(plantillaV.getEquipment());
                pverification.setId_grupo(plantillaV.getId_grupo());
                pverification.setOptionid(plantillaV.getOption());
                pverification.setValue(plantillaV.getValue());

                verificationRepository.save(pverification);
            }
        }

        Solicitud solicitud = solicitudRepository.findById(savedReport.getSolicitud())
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        EstadoSolicitud estado = estadoSolicitudRepository.findById(3L)
                .orElseThrow(() -> new RuntimeException("Estado de solicitud no encontrado"));

        // Actualizar el estado de la solicitud
        solicitud.setStatus(estado);
        solicitudRepository.save(solicitud);  // Guardar los cambios


        return savedReport;
    }

    /**
     * Obtener todos los reportes como DTO.
     *
     * @return Lista de reportes.
     */
    public List<ReportDTO> findAll() {
        List<Reporte> reportes = new ArrayList<>();
        reportRepository.findAll().forEach(reportes::add); // Convertir Iterable a List
        return reportes.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Buscar un reporte por ID.
     *
     * @param id ID del reporte.
     * @return Reporte encontrado como DTO.
     */
    public ReportDTO findById(Long id) {
        Reporte reporte = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado con el ID: " + id));
        return mapToDTO(reporte);
    }

    /**
     * Actualizar un reporte existente.
     *
     * @param id        ID del reporte a actualizar.
     * @param reportDTO Datos actualizados del reporte.
     * @return Reporte actualizado.
     */
    public Reporte update(Long id, ReportDTO reportDTO) {
        Reporte existingReport = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado con el ID: " + id));

        // Actualizar campos desde el DTO
        existingReport.setCiudad(reportDTO.getCiudad());
        existingReport.setUbicacion(reportDTO.getUbicacion());
        existingReport.setTrabajoRealizado(reportDTO.getResumen());
        existingReport.setObservaciones(reportDTO.getObservacion());
        existingReport.setEstadoEquipo(reportDTO.getEstadoEquipo());

        return reportRepository.save(existingReport);
    }

    /**
     * Eliminar un reporte por su ID.
     *
     * @param id ID del reporte.
     */

    @Transactional
    public void deleteBySolicitud(Long id) {
        if (!reportRepository.existsBySolicitud(id)) {
            throw new RuntimeException("Reporte no encontrado con el ID: " + id);
        }

        reportRepository.deleteBySolicitud(id);


        Solicitud solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        EstadoSolicitud estado = estadoSolicitudRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Estado de solicitud no encontrado"));

        // Actualizar el estado de la solicitud
        solicitud.setStatus(estado);
        solicitudRepository.save(solicitud);  // Guardar los cambios

    }

    /**
     * Mapear DTO a entidad.
     *
     * @param reportDTO DTO del reporte.
     * @return Entidad Reporte.
     */
    public Reporte mapToEntity(ReportDTO reportDTO) {


        return Reporte.builder()
                .solicitud(reportDTO.getIdSolicitud())
                .ciudad(reportDTO.getCiudad())
                .ubicacion(reportDTO.getUbicacion())
                .trabajoRealizado(reportDTO.getResumen())
                .observaciones(reportDTO.getObservacion())
                .estadoEquipo(reportDTO.getEstadoEquipo())
                .build();
    }

    /**
     * Mapear entidad a DTO.
     *
     * @param reporte Entidad Reporte.
     * @return DTO del reporte.
     */
    public ReportDTO mapToDTO(Reporte reporte) {
        return ReportDTO.builder()
                .id(reporte.getId())
                .idSolicitud(reporte.getSolicitud())
                .ciudad(reporte.getCiudad())
                .ubicacion(reporte.getUbicacion())
                .resumen(reporte.getTrabajoRealizado())
                .observacion(reporte.getObservaciones())
                .estadoEquipo(reporte.getEstadoEquipo())
                .build();
    }
}
