package com.blog.system.service;

import com.blog.system.entity.Category;
import com.blog.system.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Категория не найдена"));
    }
    
    public Category getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Категория не найдена"));
    }
    
    public Category createCategory(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Название категории не может быть пустым");
        }
        
        // Проверяем, не существует ли категория с таким именем
        if (categoryRepository.findByName(name.trim()).isPresent()) {
            throw new RuntimeException("Категория с таким названием уже существует");
        }
        
        Category category = new Category();
        category.setName(name.trim());
        category.setSlug(generateSlug(name));
        return categoryRepository.save(category);
    }
    
    private String generateSlug(String name) {
        String slug = name.toLowerCase().trim();
        
        // Простая транслитерация основных русских букв в латиницу
        slug = slug.replace("а", "a").replace("б", "b").replace("в", "v")
                .replace("г", "g").replace("д", "d").replace("е", "e")
                .replace("ё", "yo").replace("ж", "zh").replace("з", "z")
                .replace("и", "i").replace("й", "y").replace("к", "k")
                .replace("л", "l").replace("м", "m").replace("н", "n")
                .replace("о", "o").replace("п", "p").replace("р", "r")
                .replace("с", "s").replace("т", "t").replace("у", "u")
                .replace("ф", "f").replace("х", "h").replace("ц", "ts")
                .replace("ч", "ch").replace("ш", "sh").replace("щ", "sch")
                .replace("ъ", "").replace("ы", "y").replace("ь", "")
                .replace("э", "e").replace("ю", "yu").replace("я", "ya");
        
        // Удаляем все символы кроме латинских букв, цифр, пробелов и дефисов
        slug = slug.replaceAll("[^a-z0-9\\s-]", "");
        // Заменяем пробелы и множественные дефисы на один дефис
        slug = slug.replaceAll("\\s+", "-").replaceAll("-+", "-");
        // Удаляем дефисы в начале и конце
        slug = slug.replaceAll("^-+|-+$", "");
        
        if (slug.isEmpty()) {
            throw new RuntimeException("Не удалось создать slug из названия категории");
        }
        
        // Если slug уже существует, добавляем номер
        String finalSlug = slug;
        int counter = 1;
        while (categoryRepository.existsBySlug(finalSlug)) {
            finalSlug = slug + "-" + counter;
            counter++;
        }
        
        return finalSlug;
    }
}
