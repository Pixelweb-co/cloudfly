package com.app.starter1.controllers;


import com.app.starter1.dto.ScheduleDto;
import com.app.starter1.dto.ScheduleProductClientDTO;
import com.app.starter1.dto.ScheduleProductClientProjection;
import com.app.starter1.dto.ScheduleRequest;
import com.app.starter1.persistence.entity.Schedule;
import com.app.starter1.persistence.repository.ScheduleRepository;

import com.app.starter1.persistence.services.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/schedule")
public class ScheduleController  {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private ScheduleRepository scheduleRepository;

    // Endpoint para obtener los schedules de un dispositivo específico
    @GetMapping("/device/{deviceId}")
    public List<Schedule> getSchedulesByDevice(@PathVariable Long deviceId) {
        return scheduleRepository.findByDeviceId(deviceId);
    }



    @GetMapping
    public ResponseEntity<List<ScheduleProductClientProjection>> findAll() {
        List<ScheduleProductClientProjection> schedules = scheduleService.getAllSchedulesWithProductAndCustomer();
        return ResponseEntity.ok(schedules);
    }


// Endpoint para programar un mantenimiento (crear un schedule)
@PostMapping("/set_mantenimiento")
public ResponseEntity<?> setMantenimiento(@RequestBody Map<String, Long> requestBody) {
    Long id = requestBody.get("id");

    if (id == null) {
        return ResponseEntity.badRequest().body(Map.of("result", "error", "message", "ID es requerido"));
    }

    boolean updated = scheduleService.setInactiveById(id);

    if (updated) {
        return ResponseEntity.ok(Map.of("result", "success", "message", "Estado actualizado correctamente"));
    } else {
        return ResponseEntity.status(404).body(Map.of("result", "error", "message", "Schedule no encontrado"));
    }
}

    // Endpoint para programar un mantenimiento (crear un schedule)
    @PostMapping("/create")
    public ResponseEntity<?> createSchedules(@RequestBody ScheduleRequest scheduleRequest) {
        try {
            scheduleService.createSchedules(scheduleRequest);
            return ResponseEntity.ok("Mantenimientos programados correctamente");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al programar mantenimientos");
        }
    }
}
