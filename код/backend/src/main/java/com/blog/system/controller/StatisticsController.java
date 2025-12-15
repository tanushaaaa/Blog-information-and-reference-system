package com.blog.system.controller;

import com.blog.system.dto.StatisticsDTO;
import com.blog.system.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatisticsController {
    
    private final StatisticsService statisticsService;
    
    @GetMapping
    public ResponseEntity<StatisticsDTO> getStatistics() {
        return ResponseEntity.ok(statisticsService.getStatistics());
    }
}
