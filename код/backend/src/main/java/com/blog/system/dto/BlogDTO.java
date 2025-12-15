package com.blog.system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogDTO {
    private Long id;
    private String title;
    private String content;
    private String excerpt;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private Long authorId;
    private String authorName;
    private String authorEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer viewsCount;
}
