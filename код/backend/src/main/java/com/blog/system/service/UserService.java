package com.blog.system.service;

import com.blog.system.dto.AuthResponse;
import com.blog.system.dto.LoginRequest;
import com.blog.system.dto.RegisterRequest;
import com.blog.system.entity.User;
import com.blog.system.repository.UserRepository;
import com.blog.system.security.JwtUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Value("${admin.code}")
    private String adminCode;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }
        
        // Проверка кода администратора, если регистрируется администратор
        boolean isAdmin = "admin".equalsIgnoreCase(request.getRole());
        if (isAdmin) {
            if (request.getAdminCode() == null || request.getAdminCode().trim().isEmpty()) {
                throw new RuntimeException("Для регистрации администратора требуется код администратора");
            }
            if (!adminCode.equals(request.getAdminCode().trim())) {
                throw new RuntimeException("Неверный код администратора");
            }
        }
        
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(isAdmin ? User.UserRole.ADMIN : User.UserRole.USER);
        
        // Используем нативный SQL с кастингом для PostgreSQL ENUM
        String roleValue = user.getRole().name();
        Object result = entityManager.createNativeQuery(
            "INSERT INTO users (name, email, password, role, created_at, updated_at) " +
            "VALUES (?, ?, ?, CAST(? AS user_role), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
            "RETURNING id"
        )
        .setParameter(1, user.getName())
        .setParameter(2, user.getEmail())
        .setParameter(3, user.getPassword())
        .setParameter(4, roleValue)
        .getSingleResult();
        
        // Получаем сохраненного пользователя по ID
        Long userId = ((Number) result).longValue();
        user = userRepository.findById(userId).orElse(user);
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        
        return new AuthResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getId()
        );
    }
    
    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Пользователь не найден");
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Неверный пароль");
        }
        
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            User.UserRole requestedRole = "admin".equalsIgnoreCase(request.getRole()) 
                    ? User.UserRole.ADMIN 
                    : User.UserRole.USER;
            if (user.getRole() != requestedRole) {
                throw new RuntimeException("Неверная роль");
            }
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        
        return new AuthResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getId()
        );
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public long getTotalUsers() {
        return userRepository.count();
    }
}
