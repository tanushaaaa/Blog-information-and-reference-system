package com.blog.system.service;

import com.blog.system.dto.StatisticsDTO;
import com.blog.system.entity.Blog;
import com.blog.system.entity.Category;
import com.blog.system.repository.BlogRepository;
import com.blog.system.repository.CategoryRepository;
import com.blog.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatisticsService {
    
    private final UserRepository userRepository;
    private final BlogRepository blogRepository;
    private final CategoryRepository categoryRepository;
    
    public StatisticsDTO getStatistics() {
        long totalUsers = userRepository.count();
        long totalBlogs = blogRepository.count();
        
        double avgBlogsPerUser = totalUsers > 0 
                ? (double) totalBlogs / totalUsers 
                : 0.0;
        
        List<Blog> blogs = blogRepository.findAll();
        double avgTimeDays = 0.0;
        if (!blogs.isEmpty()) {
            long totalDays = blogs.stream()
                    .mapToLong(blog -> ChronoUnit.DAYS.between(
                            blog.getCreatedAt(), 
                            blog.getUpdatedAt() != null ? blog.getUpdatedAt() : blog.getCreatedAt()))
                    .sum();
            avgTimeDays = (double) totalDays / blogs.size();
        }
        
        Map<String, Long> blogsByCategory = new HashMap<>();
        List<Category> categories = categoryRepository.findAll();
        for (Category category : categories) {
            long count = blogRepository.findByCategory(category).size();
            blogsByCategory.put(category.getName(), count);
        }
        
        return new StatisticsDTO(
                totalUsers,
                totalBlogs,
                Math.round(avgBlogsPerUser * 100.0) / 100.0,
                Math.round(avgTimeDays * 100.0) / 100.0,
                blogsByCategory
        );
    }
}
