package com.blog.system.controller;

import com.blog.system.dto.BlogCreateRequest;
import com.blog.system.dto.BlogDTO;
import com.blog.system.entity.User;
import com.blog.system.service.BlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blogs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlogController {
    
    private final BlogService blogService;
    
    @GetMapping
    public ResponseEntity<List<BlogDTO>> getAllBlogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "newest") String sort) {
        
        List<BlogDTO> blogs;
        
        if (search != null && !search.isEmpty()) {
            blogs = blogService.searchBlogs(search);
        } else if (categoryId != null) {
            blogs = blogService.getBlogsByCategory(categoryId);
        } else {
            blogs = blogService.sortBlogs(sort);
        }
        
        return ResponseEntity.ok(blogs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BlogDTO> getBlogById(@PathVariable Long id) {
        try {
            BlogDTO blog = blogService.getBlogById(id);
            return ResponseEntity.ok(blog);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createBlog(
            @Valid @RequestBody BlogCreateRequest request,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            BlogDTO blog = blogService.createBlog(request, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(blog);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBlog(
            @PathVariable Long id,
            @Valid @RequestBody BlogCreateRequest request,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            boolean isAdmin = user.getRole() == User.UserRole.ADMIN;
            BlogDTO blog = blogService.updateBlog(id, request, user.getId(), isAdmin);
            return ResponseEntity.ok(blog);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBlog(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            boolean isAdmin = user.getRole() == User.UserRole.ADMIN;
            blogService.deleteBlog(id, user.getId(), isAdmin);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
