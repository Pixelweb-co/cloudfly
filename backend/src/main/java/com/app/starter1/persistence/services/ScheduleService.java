package com.app.starter1.persistence.services;
import java.util.Optional;
import java.util.stream.Collectors;

import com.app.starter1.dto.ScheduleProductClientDTO;
import com.app.starter1.dto.ScheduleProductClientProjection;
import com.app.starter1.persistence.services.CustomerService;

import com.app.starter1.dto.ScheduleDto;
import com.app.starter1.dto.ScheduleRequest;
import com.app.starter1.persistence.entity.Schedule;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.repository.ScheduleRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired CustomerService customerService;

    public void createSchedules(ScheduleRequest scheduleRequest) {
        // Buscar el dispositivo por ID
        Product device = productRepository.findById(scheduleRequest.getDeviceId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        for (String fecha : scheduleRequest.getFechas()) {
            // Verificar si ya existe un Schedule para este dispositivo y fecha
            boolean exists = scheduleRepository.existsByDeviceIdAndDate(scheduleRequest.getDeviceId(), fecha);

            if (!exists) {
                // Si no existe, guardar el nuevo Schedule
                Schedule schedule = Schedule.builder()
                        .device(device)
                        .date(LocalDate.parse(fecha).toString())  // Convierte la fecha a String
                        .status(Schedule.Status.ACTIVE)  // Estado según corresponda
                        .build();

                scheduleRepository.save(schedule);
            }
        }
    }



    public List<ScheduleProductClientProjection> getAllSchedulesWithProductAndCustomer() {
        return scheduleRepository.findAllScheduleWithProductAndClient();
    }

    public boolean setInactiveById(Long id) {
        Optional<Schedule> optionalSchedule = scheduleRepository.findById(id);

        if (optionalSchedule.isPresent()) {
            Schedule schedule = optionalSchedule.get();
            schedule.setStatus(Schedule.Status.valueOf("INACTIVE"));
            scheduleRepository.save(schedule);
            return true;
        }

        return false;
    }

}
