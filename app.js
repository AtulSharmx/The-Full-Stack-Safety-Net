/* ==========================================================================
   THE FULL-STACK SAFETY NET - SIMPLE BEGINNER JAVASCRIPT
   ==========================================================================
   Clean, easy-to-understand Vanilla JavaScript code using standard browser
   LocalStorage to save accounts and tasks without complex tools.
   ========================================================================== */

// Global State Variables
let currentUser = null;
let currentFilter = 'all';
let editingTaskId = null;

// Initial starter demo tasks for new accounts
const STARTER_TASKS = [
    { id: 'task-1', title: '🛡️ Review system security & safety checks', category: 'Work', priority: 'High', dueDate: '2026-07-05', completed: false, createdAt: Date.now() },
    { id: 'task-2', title: '📚 Read 2 chapters of Web Development Basics', category: 'Study', priority: 'Medium', dueDate: '2026-07-02', completed: true, createdAt: Date.now() - 3600000 },
    { id: 'task-3', title: '💪 Morning routine & health wellness check', category: 'Health', priority: 'Low', dueDate: '2026-06-30', completed: false, createdAt: Date.now() - 7200000 }
];

// Run setup when the webpage finishes loading
document.addEventListener('DOMContentLoaded', () => {
    checkInitialAuth();
});

/* ==========================================================================
   1. AUTHENTICATION & SESSION MANAGEMENT
   ========================================================================== */

// Check if a user is already logged in
function checkInitialAuth() {
    const savedUser = localStorage.getItem('safetynet_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showAuthScreen();
    }
}

// Switch between Sign In and Create Account tabs
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTabBtn = document.getElementById('tab-login-btn');
    const signupTabBtn = document.getElementById('tab-signup-btn');
    const authSubtitle = document.getElementById('auth-subtitle');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTabBtn.classList.add('active');
        signupTabBtn.classList.remove('active');
        authSubtitle.textContent = 'Your personal productivity & task safety dashboard';
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginTabBtn.classList.remove('active');
        signupTabBtn.classList.add('active');
        authSubtitle.textContent = 'Create your free account to get started in seconds';
    }
}

// Handle User Login
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const users = JSON.parse(localStorage.getItem('safetynet_users') || '[]');
    const userMatch = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (userMatch) {
        currentUser = { name: userMatch.name, email: userMatch.email };
        localStorage.setItem('safetynet_current_user', JSON.stringify(currentUser));
        showToast(`Welcome back, ${currentUser.name}!`, 'success');
        showDashboard();
    } else {
        showToast('Invalid email or password. Try the Demo Access!', 'error');
    }
}

// Handle User Registration
function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    const users = JSON.parse(localStorage.getItem('safetynet_users') || '[]');
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showToast('An account with this email already exists!', 'error');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('safetynet_users', JSON.stringify(users));

    // Seed default starter tasks for new user
    saveUserTasks(email, STARTER_TASKS);

    currentUser = { name: newUser.name, email: newUser.email };
    localStorage.setItem('safetynet_current_user', JSON.stringify(currentUser));

    showToast('Account created successfully!', 'success');
    showDashboard();
}

// One-Click Instant Demo Access
function fillDemoUser() {
    const demoUser = { name: 'Alex Morgan', email: 'demo@safetynet.app' };
    const users = JSON.parse(localStorage.getItem('safetynet_users') || '[]');

    if (!users.some(u => u.email === demoUser.email)) {
        users.push({ ...demoUser, password: 'password123' });
        localStorage.setItem('safetynet_users', JSON.stringify(users));
        saveUserTasks(demoUser.email, STARTER_TASKS);
    }

    currentUser = demoUser;
    localStorage.setItem('safetynet_current_user', JSON.stringify(currentUser));
    showToast('Logged in with Demo Account!', 'success');
    showDashboard();
}

// Log Out User
function handleLogout() {
    localStorage.removeItem('safetynet_current_user');
    currentUser = null;
    showToast('Logged out successfully', 'info');
    showAuthScreen();
}

// Display Controls
function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');

    document.getElementById('user-display-name').textContent = currentUser.name;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

    renderDashboard();
}

/* ==========================================================================
   2. LOCAL STORAGE BACKEND PERSISTENCE
   ========================================================================== */

function getUserTasks(email) {
    const storageKey = `safetynet_tasks_${email.toLowerCase()}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : STARTER_TASKS;
}

function saveUserTasks(email, tasks) {
    const storageKey = `safetynet_tasks_${email.toLowerCase()}`;
    localStorage.setItem(storageKey, JSON.stringify(tasks));
}

/* ==========================================================================
   3. TASK MANIPULATION (CREATE, READ, UPDATE, DELETE)
   ========================================================================== */

function renderDashboard() {
    if (!currentUser) return;

    const tasks = getUserTasks(currentUser.email);
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();

    // 1. Calculate Stats & Safety Rating
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = totalCount - completedCount;
    const highPriorityCount = tasks.filter(t => t.priority === 'High' && !t.completed).length;
    const safetyScore = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    document.getElementById('stat-total').textContent = totalCount;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-completed').textContent = completedCount;
    document.getElementById('stat-high').textContent = highPriorityCount;
    document.getElementById('safety-score-val').textContent = `${safetyScore}%`;

    // 2. Filter tasks based on current tab and search query
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery);
        
        if (!matchesSearch) return false;

        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'high') return task.priority === 'High';
        
        return true; // 'all'
    });

    // 3. Render HTML List
    const taskListEl = document.getElementById('task-list');
    const emptyStateEl = document.getElementById('empty-state');

    taskListEl.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyStateEl.classList.remove('hidden');
    } else {
        emptyStateEl.classList.add('hidden');

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card glass-panel ${task.completed ? 'completed' : ''}`;
            
            const priorityClass = task.priority.toLowerCase();
            
            card.innerHTML = `
                <div class="task-left">
                    <label class="custom-checkbox">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                        <span class="checkmark"></span>
                    </label>
                    <div class="task-details">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        <div class="task-meta">
                            <span class="badge category-badge">${getCategoryIcon(task.category)} ${task.category}</span>
                            <span class="badge priority-badge priority-${priorityClass}">● ${task.priority} Priority</span>
                            ${task.dueDate ? `<span class="task-date"><i class="fa-regular fa-calendar"></i> ${task.dueDate}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="editTask('${task.id}')" title="Edit Task">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            taskListEl.appendChild(card);
        });
    }
}

// Helper icons for categories
function getCategoryIcon(category) {
    switch (category) {
        case 'Work': return '💻';
        case 'Personal': return '🏠';
        case 'Study': return '📚';
        case 'Health': return '💪';
        default: return '📌';
    }
}

// Toggle task completion checkmark
function toggleTaskComplete(id) {
    const tasks = getUserTasks(currentUser.email);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveUserTasks(currentUser.email, tasks);
        showToast(task.completed ? 'Task completed! Safety score boosted.' : 'Task marked as active.', 'info');
        renderDashboard();
    }
}

// Save or Update Task from Modal Form
function handleSaveTask(event) {
    event.preventDefault();
    const title = document.getElementById('task-title-input').value.trim();
    const category = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    const taskId = document.getElementById('task-id').value;

    if (!title) return;

    const tasks = getUserTasks(currentUser.email);

    if (taskId) {
        // Edit Existing
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index].title = title;
            tasks[index].category = category;
            tasks[index].priority = priority;
            tasks[index].dueDate = dueDate;
            showToast('Task updated successfully!', 'success');
        }
    } else {
        // Create New
        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            category: category,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: Date.now()
        };
        tasks.unshift(newTask);
        showToast('New task added to your safety net!', 'success');
    }

    saveUserTasks(currentUser.email, tasks);
    closeTaskModal();
    renderDashboard();
}

// Open Modal for Editing
function editTask(id) {
    const tasks = getUserTasks(currentUser.email);
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.dueDate || '';

    document.getElementById('task-modal').classList.remove('hidden');
}

// Delete a task
function deleteTask(id) {
    let tasks = getUserTasks(currentUser.email);
    tasks = tasks.filter(t => t.id !== id);
    saveUserTasks(currentUser.email, tasks);
    showToast('Task removed from safety net', 'info');
    renderDashboard();
}

/* ==========================================================================
   4. MODAL & FILTER CONTROLS
   ========================================================================== */

function openTaskModal() {
    document.getElementById('modal-title').innerHTML = '<i class="fa-solid fa-square-plus"></i> Add New Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-modal').classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
}

function closeTaskModalOnOverlay(event) {
    if (event.target.id === 'task-modal') {
        closeTaskModal();
    }
}

function setFilter(filter) {
    currentFilter = filter;
    const filterButtons = document.querySelectorAll('.filter-chip');
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderDashboard();
}

function filterTasks() {
    renderDashboard();
}

/* ==========================================================================
   5. TOAST NOTIFICATIONS & UTILITIES
   ========================================================================== */

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
