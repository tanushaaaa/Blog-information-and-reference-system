package com.blog.system.service;

import com.blog.system.dto.BlogCreateRequest;
import com.blog.system.dto.BlogDTO;
import com.blog.system.entity.Blog;
import com.blog.system.entity.Category;
import com.blog.system.entity.User;
import com.blog.system.repository.BlogRepository;
import com.blog.system.repository.CategoryRepository;
import com.blog.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogService {
    
    private final BlogRepository blogRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    
    public List<BlogDTO> getAllBlogs() {
        return blogRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BlogDTO> searchBlogs(String search) {
        return blogRepository.searchBlogs(search).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BlogDTO> getBlogsByCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Категория не найдена"));
        return blogRepository.findByCategory(category).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<BlogDTO> sortBlogs(String sortBy) {
        List<Blog> blogs;
        switch (sortBy.toLowerCase()) {
            case "oldest":
                blogs = blogRepository.findAllOrderByCreatedAtAsc();
                break;
            case "popular":
                blogs = blogRepository.findAllOrderByViewsCountDesc();
                break;
            case "title":
                blogs = blogRepository.findAllOrderByTitleAsc();
                break;
            case "newest":
            default:
                blogs = blogRepository.findAllOrderByCreatedAtDesc();
                break;
        }
        return blogs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public BlogDTO getBlogById(Long id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Блог не найден"));
        
        blog.setViewsCount(blog.getViewsCount() + 1);
        blogRepository.save(blog);
        
        return convertToDTO(blog);
    }
    
    @Transactional
    public BlogDTO createBlog(BlogCreateRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        
        Blog blog = new Blog();
        blog.setTitle(request.getTitle());
        blog.setContent(request.getContent());
        blog.setExcerpt(request.getExcerpt());
        blog.setImageUrl(request.getImageUrl());
        blog.setAuthor(author);
        blog.setViewsCount(0);
        
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElse(null);
            blog.setCategory(category);
        }
        
        blog = blogRepository.save(blog);
        return convertToDTO(blog);
    }
    
    @Transactional
    public BlogDTO updateBlog(Long id, BlogCreateRequest request, Long userId, boolean isAdmin) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Блог не найден"));
        
        if (!isAdmin && !blog.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Нет прав на редактирование этого блога");
        }
        
        blog.setTitle(request.getTitle());
        blog.setContent(request.getContent());
        blog.setExcerpt(request.getExcerpt());
        blog.setImageUrl(request.getImageUrl());
        
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElse(null);
            blog.setCategory(category);
        }
        
        blog = blogRepository.save(blog);
        return convertToDTO(blog);
    }
    
    @Transactional
    public void deleteBlog(Long id, Long userId, boolean isAdmin) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Блог не найден"));
        
        if (!isAdmin && !blog.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Нет прав на удаление этого блога");
        }
        
        blogRepository.delete(blog);
    }
    
    public long getTotalBlogs() {
        return blogRepository.count();
    }
    
    private BlogDTO convertToDTO(Blog blog) {
        BlogDTO dto = new BlogDTO();
        dto.setId(blog.getId());
        dto.setTitle(blog.getTitle());
        dto.setContent(blog.getContent());
        dto.setExcerpt(blog.getExcerpt());
        dto.setImageUrl(blog.getImageUrl());
        dto.setAuthorId(blog.getAuthor().getId());
        dto.setAuthorName(blog.getAuthor().getName());
        dto.setAuthorEmail(blog.getAuthor().getEmail());
        dto.setCreatedAt(blog.getCreatedAt());
        dto.setUpdatedAt(blog.getUpdatedAt());
        dto.setViewsCount(blog.getViewsCount());
        
        if (blog.getCategory() != null) {
            dto.setCategoryId(blog.getCategory().getId());
            dto.setCategoryName(blog.getCategory().getName());
            dto.setCategorySlug(blog.getCategory().getSlug());
        }
        
        return dto;
    }
}
