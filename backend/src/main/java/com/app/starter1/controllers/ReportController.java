package com.app.starter1.controllers;

import com.app.starter1.dto.ReportDTO;
import com.app.starter1.persistence.entity.Reporte;
import com.app.starter1.persistence.services.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reportes")
public class ReportController {

    @Autowired
    private ReportService reportService;

    /**
     * Crear un nuevo reporte.
     *
     * @param reportDTO Datos del reporte a guardar.
     * @return Reporte guardado como respuesta.
     */
    @PostMapping
    public ResponseEntity<ReportDTO> createReport(@RequestBody ReportDTO reportDTO) {
        Reporte savedReport = reportService.save(reportDTO);
        return ResponseEntity.ok(reportService.mapToDTO(savedReport));
    }

    /**
     * Obtener todos los reportes.
     *
     * @return Lista de reportes en formato DTO.
     */
    @GetMapping
    public ResponseEntity<List<ReportDTO>> getAllReports() {
        List<ReportDTO> reportList = reportService.findAll();
        return ResponseEntity.ok(reportList);
    }

    /**
     * Obtener un reporte por su ID.
     *
     * @param id ID del reporte a buscar.
     * @return Reporte encontrado.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReportDTO> getReportById(@PathVariable Long id) {
        ReportDTO reportDTO = reportService.findById(id);
        return ResponseEntity.ok(reportDTO);
    }

    /**
     * Actualizar un reporte existente.
     *
     * @param id        ID del reporte a actualizar.
     * @param reportDTO Datos actualizados del reporte.
     * @return Reporte actualizado.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ReportDTO> updateReport(@PathVariable Long id, @RequestBody ReportDTO reportDTO) {
        Reporte updatedReport = reportService.update(id, reportDTO);
        return ResponseEntity.ok(reportService.mapToDTO(updatedReport));
    }

    /**
     * Eliminar un reporte por su ID.
     *
     * @param id ID del reporte a eliminar.
     * @return Respuesta indicando éxito.
     */

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReport(@PathVariable Long id) {
        System.out.println("eliminando repote "+id.toString());

        reportService.deleteBySolicitud(id);

        return ResponseEntity.ok("Reporte eliminado con éxito.");
    }
}
