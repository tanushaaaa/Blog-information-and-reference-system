// Конфигурация API
const API_BASE_URL = 'http://localhost:8080/api';

// Текущий пользователь и токен
let currentUser = null;
let authToken = null;
let blogToDeleteId = null; // ID блога для удаления

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем сохраненную авторизацию
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        authToken = savedToken;
        showMainContent();
        loadBlogs();
        loadCategories();
    } else {
        showAuthModal();
        // Загружаем категории даже для неавторизованных пользователей
        // (API разрешен для всех, категории нужны для фильтра)
        loadCategories();
    }

    // Обработчики для вкладок авторизации
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });

    // Обработчик формы входа
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Обработчик формы регистрации
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegister();
    });

    // Обработчик изменения роли в форме регистрации
    const registerRole = document.getElementById('registerRole');
    const adminCodeGroup = document.getElementById('adminCodeGroup');
    const registerAdminCode = document.getElementById('registerAdminCode');
    
    if (registerRole && adminCodeGroup) {
        registerRole.addEventListener('change', function() {
            if (this.value === 'admin') {
                adminCodeGroup.style.display = 'block';
                registerAdminCode.setAttribute('required', 'required');
            } else {
                adminCodeGroup.style.display = 'none';
                registerAdminCode.removeAttribute('required');
                registerAdminCode.value = '';
            }
        });
    }

    // Закрытие модального окна авторизации
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', function() {
            showNotification('Для доступа к системе необходимо авторизоваться', 'warning');
        });
    }

    // Выход из системы
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            handleLogout();
        });
    }

    // Навигация по страницам
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            switchPage(page);
        });
    });

    // Добавление блога
    const addBlogBtns = document.querySelectorAll('#addBlogBtn, #addBlogBtnTable');
    addBlogBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            openBlogModal();
        });
    });

    // Закрытие модального окна блога
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const blogModal = document.getElementById('blogModal');
    
    if (closeModal) {
        closeModal.addEventListener('click', closeBlogModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeBlogModal);
    }
    if (blogModal) {
        blogModal.addEventListener('click', function(e) {
            if (e.target === blogModal) {
                closeBlogModal();
            }
        });
    }

    // Закрытие модального окна просмотра блога
    const closeBlogViewModalBtn = document.getElementById('closeBlogViewModal');
    if (closeBlogViewModalBtn) {
        closeBlogViewModalBtn.addEventListener('click', closeBlogViewModal);
    }

    // Функция для закрытия модального окна удаления
    function closeDeleteConfirmModal() {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        if (deleteConfirmModal) {
            deleteConfirmModal.classList.remove('active');
        }
        blogToDeleteId = null;
    }
    
    // Функция для открытия модального окна удаления (доступна глобально)
    window.openDeleteConfirmModal = function(id) {
        blogToDeleteId = id;
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        if (deleteConfirmModal) {
            deleteConfirmModal.classList.add('active');
        }
    };
    
    // Инициализация обработчиков для модального окна удаления
    function initDeleteModal() {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        const closeDeleteModal = document.getElementById('closeDeleteModal');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const modalContent = deleteConfirmModal?.querySelector('.modal-content');
        
        // Удаляем старые обработчики и добавляем новые
        if (closeDeleteModal) {
            closeDeleteModal.onclick = null;
            closeDeleteModal.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeDeleteConfirmModal();
            });
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.onclick = null;
            cancelDeleteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeDeleteConfirmModal();
            });
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.onclick = null;
            confirmDeleteBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Кнопка удалить нажата! blogToDeleteId =', blogToDeleteId);
                
                if (blogToDeleteId) {
                    const idToDelete = blogToDeleteId;
                    closeDeleteConfirmModal();
                    await performDeleteBlog(idToDelete);
                } else {
                    console.error('Ошибка: blogToDeleteId не установлен!');
                    showNotification('Ошибка: не указан ID блога для удаления', 'error');
                }
            });
        }
        
        // Закрытие модального окна при клике вне его
        if (deleteConfirmModal) {
            deleteConfirmModal.onclick = null;
            deleteConfirmModal.addEventListener('click', function(e) {
                if (e.target === deleteConfirmModal) {
                    closeDeleteConfirmModal();
                }
            });
        }
        
        // Предотвращаем закрытие при клике на содержимое модального окна
        if (modalContent) {
            modalContent.onclick = null;
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
    
    // Инициализируем обработчики при загрузке
    initDeleteModal();

    // Закрытие модального окна просмотра при клике вне его
    const blogViewModal = document.getElementById('blogViewModal');
    if (blogViewModal) {
        blogViewModal.addEventListener('click', function(e) {
            if (e.target === blogViewModal) {
                closeBlogViewModal();
            }
        });
    }

    // Форма блога
    const blogForm = document.getElementById('blogForm');
    if (blogForm) {
        blogForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBlogSubmit();
        });
    }

    // Обработка выбора "Создать новую категорию"
    const blogCategory = document.getElementById('blogCategory');
    const newCategoryGroup = document.getElementById('newCategoryGroup');
    const newCategoryName = document.getElementById('newCategoryName');
    
    if (blogCategory && newCategoryGroup && newCategoryName) {
        blogCategory.addEventListener('change', function() {
            if (this.value === '__NEW__') {
                newCategoryGroup.style.display = 'block';
                newCategoryName.setAttribute('required', 'required');
            } else {
                newCategoryGroup.style.display = 'none';
                newCategoryName.removeAttribute('required');
                newCategoryName.value = '';
            }
        });
    }

    // Поиск на главной странице
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('#pageHome .search-btn');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500));
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    // Поиск на странице таблицы
    const searchInputTable = document.getElementById('searchInputTable');
    const searchBtnTable = document.getElementById('searchBtnTable');
    if (searchInputTable) {
        searchInputTable.addEventListener('input', debounce(handleSearch, 500));
    }
    if (searchBtnTable) {
        searchBtnTable.addEventListener('click', handleSearch);
    }

    // Фильтры на главной странице
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilter);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', handleFilter);
    }

    // Фильтры на странице таблицы
    const categoryFilterTable = document.getElementById('categoryFilterTable');
    const sortFilterTable = document.getElementById('sortFilterTable');
    if (categoryFilterTable) {
        categoryFilterTable.addEventListener('change', handleFilter);
    }
    if (sortFilterTable) {
        sortFilterTable.addEventListener('change', handleFilter);
    }
});

// Утилита для задержки выполнения функции
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Функция для выполнения API запросов
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
        
        if (!response.ok) {
            let errorMessage = 'Ошибка запроса';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    errorMessage = data.message || data.error || errorMessage;
                } else {
                    errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
                }
            } catch (e) {
                errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        // Проверяем, есть ли контент в ответе (например, для DELETE запросов возвращается 204 No Content)
        const contentType = response.headers.get('content-type');
        if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
            // Пустой ответ (например, для DELETE запросов)
            return null;
        }
        
        // Парсим JSON только если есть контент
        const text = await response.text();
        if (!text || text.trim() === '') {
            return null;
        }
        
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('Ошибка парсинга JSON:', e, 'Ответ:', text);
            return null;
        }
    } catch (error) {
        console.error('API Error:', error);
        // Проверяем, является ли это ошибкой сети
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend запущен на http://localhost:8080');
        }
        throw error;
    }
}

// Показать модальное окно авторизации
function showAuthModal() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    authModal.classList.add('active');
    mainContainer.style.display = 'none';
}

// Показать основной контент
function showMainContent() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    authModal.classList.remove('active');
    mainContainer.style.display = 'block';
    updateUserInfo();
    loadBlogs();
    loadCategories();
}

// Переключение вкладок авторизации
function switchAuthTab(tabName) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
    
    const authModalTitle = document.getElementById('authModalTitle');
    authModalTitle.textContent = tabName === 'login' ? 'Вход в систему' : 'Регистрация';
}

// Обработка входа
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    if (!email || !password || !role) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        });

        currentUser = {
            email: response.email,
            name: response.name,
            role: response.role,
            id: response.id
        };
        authToken = response.token;

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);

        showNotification('Успешный вход в систему', 'success');
        showMainContent();
    } catch (error) {
        showNotification(error.message || 'Ошибка входа', 'error');
    }
}

// Обработка регистрации
async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const adminCode = document.getElementById('registerAdminCode').value;

    if (!name || !email || !password || !role) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    // Проверка кода администратора, если выбрана роль администратора
    if (role === 'admin' && !adminCode) {
        showNotification('Для регистрации администратора требуется код администратора', 'error');
        return;
    }

    try {
        const requestData = { name, email, password, role };
        if (role === 'admin') {
            requestData.adminCode = adminCode;
        }
        
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        currentUser = {
            email: response.email,
            name: response.name,
            role: response.role,
            id: response.id
        };
        authToken = response.token;

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);

        showNotification('Регистрация успешна', 'success');
        showMainContent();
        loadBlogs();
        loadCategories();
        
        // Очистка формы
        document.getElementById('registerForm').reset();
        document.getElementById('adminCodeGroup').style.display = 'none';
    } catch (error) {
        showNotification(error.message || 'Ошибка регистрации', 'error');
    }
}

// Выход из системы
function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    showNotification('Вы вышли из системы', 'info');
    showAuthModal();
    
    // Очистка форм
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// Обновление информации о пользователе
function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        const roleText = currentUser.role === 'ADMIN' ? 'Администратор' : 'Пользователь';
        userInfo.textContent = `${currentUser.name} (${roleText})`;
    }
}

// Переключение страниц
function switchPage(pageName) {
    const pages = document.querySelectorAll('.page-content');
    const navLinks = document.querySelectorAll('.nav-link');
    
    pages.forEach(page => page.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(`page${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Загрузка данных при переключении страниц
    if (pageName === 'home' || pageName === 'table') {
        loadBlogs();
        loadCategories(); // Обновляем категории при переключении на страницы с блогами
    } else if (pageName === 'statistics') {
        updateStatistics();
    }
}

// Загрузка блогов с сервера
async function loadBlogs() {
    try {
        // Получаем значения из активной страницы (главная или таблица)
        const activePage = document.querySelector('.page-content.active');
        const isTablePage = activePage?.id === 'pageTable';
        
        const search = isTablePage 
            ? (document.getElementById('searchInputTable')?.value || '')
            : (document.getElementById('searchInput')?.value || '');
        const categoryId = isTablePage
            ? (document.getElementById('categoryFilterTable')?.value || '')
            : (document.getElementById('categoryFilter')?.value || '');
        const sort = isTablePage
            ? (document.getElementById('sortFilterTable')?.value || 'newest')
            : (document.getElementById('sortFilter')?.value || 'newest');

        let url = '/blogs?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (categoryId) url += `categoryId=${categoryId}&`;
        url += `sort=${sort}`;

        const blogs = await apiRequest(url);
        
        // Обновляем карточки
        renderBlogCards(blogs);
        // Обновляем таблицу
        renderBlogTable(blogs);
    } catch (error) {
        console.error('Ошибка загрузки блогов:', error);
        showNotification('Ошибка загрузки блогов', 'error');
    }
}

// Отображение блогов в виде карточек
function renderBlogCards(blogs) {
    const blogsGrid = document.getElementById('blogsGrid');
    if (!blogsGrid) return;

    if (blogs.length === 0) {
        blogsGrid.innerHTML = '<div class="empty-state"><h3>Блоги не найдены</h3><p>Попробуйте изменить параметры поиска</p></div>';
        return;
    }

    blogsGrid.innerHTML = blogs.map(blog => `
        <article class="blog-card" data-blog-id="${blog.id}" style="opacity: 1; transform: scale(1); transition: opacity 0.3s, transform 0.3s;">
            <div class="blog-image">
                <img src="${blog.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${blog.title}">
            </div>
            <div class="blog-content">
                <div class="blog-category">${blog.categoryName || 'Без категории'}</div>
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-excerpt">${blog.excerpt || blog.content.substring(0, 150) + '...'}</p>
                <div class="blog-meta">
                    <span class="blog-author">👤 Автор: ${blog.authorName}</span>
                    <span class="blog-date">📅 ${formatDate(blog.createdAt)}</span>
                </div>
                <div class="blog-actions">
                    <button class="btn-read" onclick="viewBlog(${blog.id})">Читать далее</button>
                    ${canEditBlog(blog) ? `<button class="btn-edit" onclick="editBlog(${blog.id})">✏️</button>` : ''}
                    ${canDeleteBlog(blog) ? `<button class="btn-delete" onclick="deleteBlog(${blog.id})">🗑️</button>` : ''}
                </div>
            </div>
        </article>
    `).join('');
}

// Отображение блогов в таблице
function renderBlogTable(blogs) {
    const tableBody = document.getElementById('blogsTableBody');
    if (!tableBody) return;

    if (blogs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Блоги не найдены</td></tr>';
        return;
    }

    tableBody.innerHTML = blogs.map(blog => `
        <tr data-blog-id="${blog.id}" style="opacity: 1; transition: opacity 0.3s;">
            <td>${blog.id}</td>
            <td>${blog.title}</td>
            <td><span class="table-category">${blog.categoryName || 'Без категории'}</span></td>
            <td>${blog.authorName}</td>
            <td>${formatDate(blog.createdAt)}</td>
            <td>
                ${canEditBlog(blog) ? `<button class="btn-table btn-edit" onclick="editBlog(${blog.id})">✏️</button>` : ''}
                ${canDeleteBlog(blog) ? `<button class="btn-table btn-delete" onclick="deleteBlog(${blog.id})">🗑️</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// Проверка прав на редактирование
function canEditBlog(blog) {
    if (!currentUser) return false;
    return currentUser.role === 'ADMIN' || blog.authorId === currentUser.id;
}

// Проверка прав на удаление
function canDeleteBlog(blog) {
    if (!currentUser) return false;
    return currentUser.role === 'ADMIN' || blog.authorId === currentUser.id;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Загрузка категорий
async function loadCategories() {
    try {
        const categories = await apiRequest('/categories');
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryFilterTable = document.getElementById('categoryFilterTable');
        const blogCategorySelect = document.getElementById('blogCategory');
        
        // Функция для создания HTML опций категорий
        const createCategoryOptions = (currentValue) => {
            let optionsHTML = '<option value="">Все категории</option>';
            
            if (categories && categories.length > 0) {
                optionsHTML += categories.map(cat => 
                    `<option value="${cat.id}">${cat.name}</option>`
                ).join('');
            } else {
                optionsHTML += '<option value="" disabled>Нет доступных категорий</option>';
            }
            
            return optionsHTML;
        };
        
        // Обновляем фильтр категорий на главной странице
        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = createCategoryOptions(currentValue);
            if (currentValue) {
                categoryFilter.value = currentValue;
            }
        }
        
        // Обновляем фильтр категорий на странице таблицы
        if (categoryFilterTable) {
            const currentValue = categoryFilterTable.value;
            categoryFilterTable.innerHTML = createCategoryOptions(currentValue);
            if (currentValue) {
                categoryFilterTable.value = currentValue;
            }
        }
        
        // Обновляем выбор категории в форме создания/редактирования блога
        if (blogCategorySelect) {
            const currentValue = blogCategorySelect.value;
            let selectHTML = '<option value="">Выберите категорию (необязательно)</option>';
            
            if (categories && categories.length > 0) {
                selectHTML += categories.map(cat => 
                    `<option value="${cat.id}">${cat.name}</option>`
                ).join('');
            }
            
            selectHTML += '<option value="__NEW__">+ Создать новую категорию</option>';
            blogCategorySelect.innerHTML = selectHTML;
            
            // Восстанавливаем выбранное значение, если оно не было "__NEW__"
            if (currentValue && currentValue !== '__NEW__') {
                blogCategorySelect.value = currentValue;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        // При ошибке показываем хотя бы "Все категории"
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryFilterTable = document.getElementById('categoryFilterTable');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Все категории</option>';
        }
        if (categoryFilterTable) {
            categoryFilterTable.innerHTML = '<option value="">Все категории</option>';
        }
    }
}

// Открытие модального окна блога
let editingBlogId = null;

function openBlogModal(isEdit = false, blogId = null) {
    const modal = document.getElementById('blogModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('blogForm');
    
    editingBlogId = blogId;
    
    // Загружаем категории при открытии модального окна (на случай, если добавились новые)
    loadCategories();
    
    if (isEdit && blogId) {
        modalTitle.textContent = 'Редактировать блог';
        loadBlogForEdit(blogId);
    } else {
        modalTitle.textContent = 'Добавить новый блог';
        form.reset();
        editingBlogId = null;
    }
    
    modal.classList.add('active');
}

// Загрузка блога для редактирования
async function loadBlogForEdit(blogId) {
    try {
        const blog = await apiRequest(`/blogs/${blogId}`);
        document.getElementById('blogTitle').value = blog.title || '';
        document.getElementById('blogCategory').value = blog.categoryId || '';
        document.getElementById('blogContent').value = blog.content || '';
        document.getElementById('blogImage').value = blog.imageUrl || '';
        document.getElementById('blogExcerpt').value = blog.excerpt || '';
    } catch (error) {
        showNotification('Ошибка загрузки блога', 'error');
    }
}

// Закрытие модального окна блога
function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    modal.classList.remove('active');
    document.getElementById('blogForm').reset();
    editingBlogId = null;
    
    // Скрываем поле новой категории
    const newCategoryGroup = document.getElementById('newCategoryGroup');
    const newCategoryName = document.getElementById('newCategoryName');
    if (newCategoryGroup) {
        newCategoryGroup.style.display = 'none';
    }
    if (newCategoryName) {
        newCategoryName.removeAttribute('required');
        newCategoryName.value = '';
    }
}

// Обработка отправки формы блога
async function handleBlogSubmit() {
    if (!currentUser) {
        showNotification('Необходима авторизация', 'error');
        return;
    }

    const title = document.getElementById('blogTitle').value;
    let categoryId = document.getElementById('blogCategory').value;
    const content = document.getElementById('blogContent').value;
    const imageUrl = document.getElementById('blogImage').value;
    const excerpt = document.getElementById('blogExcerpt')?.value || '';
    const newCategoryName = document.getElementById('newCategoryName')?.value?.trim();

    if (!title || !content) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }

    // Если выбрано создание новой категории
    if (categoryId === '__NEW__') {
        if (!newCategoryName) {
            showNotification('Введите название новой категории', 'error');
            return;
        }
        
        try {
            // Создаем новую категорию
            const newCategory = await apiRequest('/categories', {
                method: 'POST',
                body: JSON.stringify({ name: newCategoryName })
            });
            categoryId = newCategory.id.toString();
            showNotification('Категория успешно создана', 'success');
        } catch (error) {
            showNotification(error.message || 'Ошибка создания категории', 'error');
            return;
        }
    }

    const blogData = {
        title,
        content,
        excerpt,
        imageUrl: imageUrl || null,
        categoryId: categoryId && categoryId !== '__NEW__' ? parseInt(categoryId) : null
    };

    try {
        if (editingBlogId) {
            await apiRequest(`/blogs/${editingBlogId}`, {
                method: 'PUT',
                body: JSON.stringify(blogData)
            });
            showNotification('Блог успешно обновлен', 'success');
        } else {
            await apiRequest('/blogs', {
                method: 'POST',
                body: JSON.stringify(blogData)
            });
            showNotification('Блог успешно создан', 'success');
        }
        
        closeBlogModal();
        
        // Обновляем блог в DOM напрямую без перезагрузки всего списка
        if (editingBlogId) {
            // При редактировании: обновляем данные конкретного блога
            const updatedBlog = await apiRequest(`/blogs/${editingBlogId}`);
            
            // Находим и обновляем карточку
            const blogCard = document.querySelector(`.blog-card[data-blog-id="${editingBlogId}"], article[data-blog-id="${editingBlogId}"]`);
            if (blogCard) {
                blogCard.style.transition = 'opacity 0.3s';
                blogCard.style.opacity = '0.7';
                
                // Перезагружаем только этот блог
                setTimeout(async () => {
                    const blogs = await apiRequest('/blogs?sort=newest');
                    const activePage = document.querySelector('.page-content.active');
                    if (activePage?.id === 'pageHome') {
                        renderBlogCards(blogs);
                    } else if (activePage?.id === 'pageTable') {
                        renderBlogTable(blogs);
                    }
                }, 200);
            } else {
                // Если карточка не найдена, перезагружаем список
                loadBlogs();
            }
        } else {
            // При создании: просто перезагружаем список для нового блога
            loadBlogs();
        }
        
        loadCategories(); // Обновляем категории на случай, если добавились новые
        
        // Обновляем статистику, если открыта страница статистики
        const statisticsPage = document.getElementById('pageStatistics');
        if (statisticsPage && statisticsPage.classList.contains('active')) {
            updateStatistics();
        }
    } catch (error) {
        showNotification(error.message || 'Ошибка сохранения блога', 'error');
    }
}

// Просмотр блога
async function viewBlog(id) {
    try {
        const blog = await apiRequest(`/blogs/${id}`);
        
        const modal = document.getElementById('blogViewModal');
        const modalTitle = document.getElementById('blogViewTitle');
        const modalContent = document.getElementById('blogViewContent');
        
        modalTitle.textContent = blog.title;
        
        // Форматируем дату
        const formattedDate = formatDate(blog.createdAt);
        const updatedDate = blog.updatedAt ? formatDate(blog.updatedAt) : null;
        
        modalContent.innerHTML = `
            <div class="blog-view-header">
                <div class="blog-view-meta">
                    <span class="blog-view-category">${blog.categoryName || 'Без категории'}</span>
                    <span class="blog-view-author">👤 Автор: ${blog.authorName}</span>
                    <span class="blog-view-date">📅 Создан: ${formattedDate}</span>
                    ${updatedDate && updatedDate !== formattedDate ? `<span class="blog-view-date">✏️ Обновлен: ${updatedDate}</span>` : ''}
                    <span class="blog-view-views">👁️ Просмотров: ${blog.viewsCount || 0}</span>
                </div>
            </div>
            ${blog.imageUrl ? `<div class="blog-view-image"><img src="${blog.imageUrl}" alt="${blog.title}"></div>` : ''}
            <div class="blog-view-excerpt">
                <p><strong>${blog.excerpt || ''}</strong></p>
            </div>
            <div class="blog-view-text">
                ${blog.content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
            <div class="blog-view-actions">
                ${canEditBlog(blog) ? `<button class="btn-edit" onclick="closeBlogViewModal(); editBlog(${blog.id});">✏️ Редактировать</button>` : ''}
                ${canDeleteBlog(blog) ? `<button class="btn-delete" onclick="closeBlogViewModal(); deleteBlog(${blog.id});">🗑️ Удалить</button>` : ''}
                <button class="btn-cancel" onclick="closeBlogViewModal()">Закрыть</button>
            </div>
        `;
        
        modal.classList.add('active');
    } catch (error) {
        showNotification('Ошибка загрузки блога', 'error');
        console.error('Ошибка просмотра блога:', error);
    }
}

// Закрытие модального окна просмотра блога
function closeBlogViewModal() {
    const modal = document.getElementById('blogViewModal');
    modal.classList.remove('active');
}

// Редактирование блога
function editBlog(id) {
    openBlogModal(true, id);
}

// Удаление блога
async function deleteBlog(id) {
    blogToDeleteId = id;
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    if (deleteConfirmModal) {
        deleteConfirmModal.classList.add('active');
    }
}

async function performDeleteBlog(id) {
    try {
        await apiRequest(`/blogs/${id}`, {
            method: 'DELETE'
        });
        
        // Удаляем блог из DOM напрямую с анимацией
        const blogCard = document.querySelector(`.blog-card[data-blog-id="${id}"], article[data-blog-id="${id}"]`);
        const blogRow = document.querySelector(`tr[data-blog-id="${id}"]`);
        
        if (blogCard) {
            blogCard.style.transition = 'opacity 0.3s, transform 0.3s';
            blogCard.style.opacity = '0';
            blogCard.style.transform = 'scale(0.9)';
            setTimeout(() => {
                blogCard.remove();
                checkEmptyState();
            }, 300);
        }
        
        if (blogRow) {
            blogRow.style.transition = 'opacity 0.3s';
            blogRow.style.opacity = '0';
            setTimeout(() => {
                blogRow.remove();
                checkEmptyState();
            }, 300);
        }
        
        // Закрываем модальное окно просмотра, если оно открыто
        const blogViewModal = document.getElementById('blogViewModal');
        if (blogViewModal && blogViewModal.classList.contains('active')) {
            closeBlogViewModal();
        }
        
        showNotification('Блог успешно удален', 'success');
        loadCategories(); // Обновляем категории
        
        // Обновляем статистику, если открыта страница статистики
        const statisticsPage = document.getElementById('pageStatistics');
        if (statisticsPage && statisticsPage.classList.contains('active')) {
            updateStatistics();
        }
    } catch (error) {
        showNotification(error.message || 'Ошибка удаления блога', 'error');
    }
}

// Проверка пустого состояния после удаления
function checkEmptyState() {
    const blogsGrid = document.getElementById('blogsGrid');
    const tableBody = document.getElementById('blogsTableBody');
    
    if (blogsGrid && blogsGrid.children.length === 0) {
        blogsGrid.innerHTML = '<div class="empty-state"><h3>Блоги не найдены</h3><p>Попробуйте изменить параметры поиска</p></div>';
    }
    if (tableBody && tableBody.children.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Блоги не найдены</td></tr>';
    }
}

// Поиск
function handleSearch() {
    loadBlogs();
}

// Фильтрация
function handleFilter() {
    loadBlogs();
}

// Обновление статистики
async function updateStatistics() {
    try {
        const stats = await apiRequest('/statistics');
        
        document.getElementById('totalUsers').textContent = stats.totalUsers || '0';
        document.getElementById('totalBlogs').textContent = stats.totalBlogs || '0';
        document.getElementById('avgBlogs').textContent = stats.avgBlogsPerUser?.toFixed(1) || '0';
        
        // Обновление диаграммы категорий (если есть canvas)
        updateCategoryChart(stats.blogsByCategory);
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        // Устанавливаем значения по умолчанию
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalBlogs').textContent = '0';
        document.getElementById('avgBlogs').textContent = '0';
    }
}

// Обновление диаграммы категорий
function updateCategoryChart(blogsByCategory) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas || !blogsByCategory) return;

    const ctx = canvas.getContext('2d');
    const categories = Object.keys(blogsByCategory);
    const values = Object.values(blogsByCategory);
    
    // Если нет категорий, показываем сообщение
    if (categories.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Нет данных для отображения', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Динамически изменяем ширину canvas если категорий много
    const minBarWidth = 50;
    const minBarSpacing = 15;
    const requiredWidth = categories.length * (minBarWidth + minBarSpacing) + 80;
    if (requiredWidth > canvas.width) {
        canvas.width = requiredWidth;
    }
    
    // Настройки
    const paddingTop = 50; // Отступ сверху для подписей значений
    const paddingBottom = 80; // Отступ снизу для подписей категорий
    const paddingLeft = 50; // Отступ слева для оси Y
    const chartHeight = canvas.height - paddingTop - paddingBottom;
    const chartWidth = canvas.width - paddingLeft - 20;
    const actualMaxValue = Math.max(...values, 1);
    
    // Вычисляем "красивое" максимальное значение для оси Y
    // Округляем вверх до ближайшего "красивого" числа
    function calculateNiceMax(value) {
        if (value === 0) return 1;
        const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
        const normalized = value / magnitude;
        let niceValue;
        
        if (normalized <= 1) niceValue = 1;
        else if (normalized <= 2) niceValue = 2;
        else if (normalized <= 5) niceValue = 5;
        else niceValue = 10;
        
        return niceValue * magnitude;
    }
    
    const maxValue = calculateNiceMax(actualMaxValue);
    
    // Вычисляем оптимальное количество делений на оси Y (от 4 до 8)
    function calculateOptimalTicks(maxVal) {
        const range = maxVal;
        const roughStep = range / 5; // Примерно 5 делений
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const normalizedStep = roughStep / magnitude;
        
        let step;
        if (normalizedStep <= 1) step = 1;
        else if (normalizedStep <= 2) step = 2;
        else if (normalizedStep <= 5) step = 5;
        else step = 10;
        
        step = step * magnitude;
        const tickCount = Math.ceil(maxVal / step);
        
        return { step, tickCount: Math.min(tickCount, 8) }; // Максимум 8 делений
    }
    
    const { step, tickCount } = calculateOptimalTicks(maxValue);
    const adjustedMaxValue = step * tickCount;
    
    // Вычисляем ширину столбца и расстояние между ними
    const totalBarSpace = categories.length * minBarWidth;
    const totalSpacing = (categories.length - 1) * minBarSpacing;
    const availableWidth = Math.min(chartWidth, totalBarSpace + totalSpacing);
    const barWidth = Math.min(minBarWidth, (availableWidth - totalSpacing) / categories.length);
    const barSpacing = categories.length > 1 
        ? (availableWidth - (barWidth * categories.length)) / (categories.length - 1)
        : 0;
    
    // Очистка
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем сетку с правильными значениями
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
        const tickValue = i * step;
        ticks.push(tickValue);
        const y = paddingTop + chartHeight - (tickValue / adjustedMaxValue) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(canvas.width - 10, y);
        ctx.stroke();
    }
    
    // Рисуем столбцы
    categories.forEach((category, index) => {
        const x = paddingLeft + index * (barWidth + barSpacing);
        const barHeight = values[index] > 0 ? (values[index] / adjustedMaxValue) * chartHeight : 0;
        const y = paddingTop + chartHeight - barHeight;
        
        // Цвет столбца (разные цвета для каждого столбца)
        const colors = ['#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9f1239', '#881337'];
        ctx.fillStyle = colors[index % colors.length];
        
        // Рисуем столбец
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Обводка столбца
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Подпись количества сверху столбца
        if (values[index] > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(values[index].toString(), x + barWidth / 2, y - 8);
        }
        
        // Подпись названия категории под столбцом
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const textX = x + barWidth / 2;
        const textY = paddingTop + chartHeight + 10;
        
        // Если название длинное, разбиваем на две строки
        let displayName = category;
        const maxChars = Math.floor(barWidth / 6); // Примерно 6px на символ
        
        if (category.length > maxChars) {
            // Разбиваем на слова и переносим
            const words = category.split(' ');
            if (words.length > 1) {
                const mid = Math.ceil(words.length / 2);
                displayName = words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
                // Рисуем многострочный текст
                const lines = displayName.split('\n');
                lines.forEach((line, lineIndex) => {
                    ctx.fillText(line, textX, textY + (lineIndex * 15));
                });
            } else {
                // Если одно длинное слово, обрезаем
                displayName = category.substring(0, maxChars - 3) + '...';
                ctx.fillText(displayName, textX, textY);
            }
        } else {
            ctx.fillText(displayName, textX, textY);
        }
    });
    
    // Рисуем ось Y (шкала значений)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, paddingTop + chartHeight);
    ctx.lineTo(canvas.width - 10, paddingTop + chartHeight);
    ctx.stroke();
    
    // Подписи на оси Y (только уникальные целые значения)
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Используем уже рассчитанные тики
    ticks.forEach(tickValue => {
        const y = paddingTop + chartHeight - (tickValue / adjustedMaxValue) * chartHeight;
        // Показываем только целые числа
        if (Number.isInteger(tickValue)) {
            ctx.fillText(tickValue.toString(), paddingLeft - 10, y);
        }
    });
}

// Показать уведомление
function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    if (!notification || !notificationMessage) return;
    
    notification.className = `notification ${type} show`;
    notificationMessage.textContent = message;
    
    const closeBtn = document.getElementById('notificationClose');
    if (closeBtn) {
        closeBtn.onclick = function() {
            notification.classList.remove('show');
        };
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}
