package com.blog.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDTO {
    private Long totalUsers;
    private Long totalBlogs;
    private Double avgBlogsPerUser;
    private Double avgTimeDays;
    private Map<String, Long> blogsByCategory;
}
