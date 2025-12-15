package com.blog.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Имя обязательно")
    @Size(min = 2, max = 255, message = "Имя должно быть от 2 до 255 символов")
    private String name;
    
    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный формат email")
    private String email;
    
    @NotBlank(message = "Пароль обязателен")
    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String password;
    
    private String role = "user";
    
    private String adminCode; // Код администратора (требуется только для роли admin)
}
