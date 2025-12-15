package com.blog.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BlogCreateRequest {
    
    @NotBlank(message = "Название обязательно")
    @Size(max = 255, message = "Название не должно превышать 255 символов")
    private String title;
    
    @NotBlank(message = "Содержание обязательно")
    private String content;
    
    private String excerpt;
    
    private String imageUrl;
    
    private Long categoryId;
}
