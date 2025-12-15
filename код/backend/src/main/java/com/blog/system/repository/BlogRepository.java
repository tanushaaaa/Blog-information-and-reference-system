package com.blog.system.repository;

import com.blog.system.entity.Blog;
import com.blog.system.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    
    List<Blog> findByCategory(Category category);
    
    List<Blog> findByAuthorId(Long authorId);
    
    @Query("SELECT b FROM Blog b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.content) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(b.excerpt) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Blog> searchBlogs(@Param("search") String search);
    
    @Query("SELECT b FROM Blog b ORDER BY b.createdAt DESC")
    List<Blog> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT b FROM Blog b ORDER BY b.createdAt ASC")
    List<Blog> findAllOrderByCreatedAtAsc();
    
    @Query("SELECT b FROM Blog b ORDER BY b.title ASC")
    List<Blog> findAllOrderByTitleAsc();
    
    @Query("SELECT b FROM Blog b ORDER BY b.viewsCount DESC")
    List<Blog> findAllOrderByViewsCountDesc();
    
    long count();
}
