let currentUser = null;
let currentFilter = 'all';

const DEFAULT_TASKS = [
    { 
        id: 'task-1', 
        title: 'Review workflow rules', 
        description: 'Configure priority alerts for projects.',
        category: 'Work', 
        priority: 'High', 
        dueDate: '2026-07-05', 
        completed: false, 
        createdAt: Date.now() 
    }
];

document.addEventListener('DOMContentLoaded', () => {
    checkInitialAuth();
});

function checkInitialAuth() {
    const savedUser = localStorage.getItem('safetynet_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showAuthScreen();
    }
}

function handleGoogleLogin(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    currentUser = { 
        name: payload.name, 
        email: payload.email
    };
    
    const users = JSON.parse(localStorage.getItem('safetynet_users') || '[]');
    if (!users.some(u => u.email === currentUser.email)) {
        users.push(currentUser);
        localStorage.setItem('safetynet_users', JSON.stringify(users));
        saveUserTasks(currentUser.email, DEFAULT_TASKS);
    }

    localStorage.setItem('safetynet_current_user', JSON.stringify(currentUser));
    showToast(`Welcome, ${currentUser.name}`);
    showDashboard();
}

function handleLogout() {
    localStorage.removeItem('safetynet_current_user');
    currentUser = null;
    showToast('Signed out');
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('dashboard-screen').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    document.getElementById('user-display-name').textContent = currentUser.name;
    renderDashboard();
}

function getUserTasks(email) {
    const data = localStorage.getItem(`safetynet_tasks_${email.toLowerCase()}`);
    return data ? JSON.parse(data) : DEFAULT_TASKS;
}

function saveUserTasks(email, tasks) {
    localStorage.setItem(`safetynet_tasks_${email.toLowerCase()}`, JSON.stringify(tasks));
}

function renderDashboard() {
    if (!currentUser) return;
    const tasks = getUserTasks(currentUser.email);
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();

    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = totalCount - completedCount;

    document.getElementById('stat-total').textContent = totalCount;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-completed').textContent = completedCount;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery) || 
                             (task.description && task.description.toLowerCase().includes(searchQuery));
        if (!matchesSearch) return false;
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    const taskListEl = document.getElementById('task-list');
    const emptyStateEl = document.getElementById('empty-state');
    taskListEl.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyStateEl.classList.remove('hidden');
    } else {
        emptyStateEl.classList.add('hidden');
        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.completed ? 'completed' : ''}`;
            card.innerHTML = `
                <div class="task-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                    <div class="task-details">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        ${task.description ? `<span class="task-desc">${escapeHtml(task.description)}</span>` : ''}
                        <div class="task-meta">
                            <span>${task.category}</span> • 
                            <span>${task.priority} Priority</span>
                            ${task.dueDate ? ` • <span>${task.dueDate}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn" onclick="editTask('${task.id}')">Edit</button>
                    <button class="action-btn" onclick="deleteTask('${task.id}')">Delete</button>
                </div>
            `;
            taskListEl.appendChild(card);
        });
    }
}

function toggleTaskComplete(id) {
    const tasks = getUserTasks(currentUser.email);
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveUserTasks(currentUser.email, tasks);
        renderDashboard();
    }
}

function handleSaveTask(event) {
    event.preventDefault();
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const category = document.getElementById('task-category').value;
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;
    const taskId = document.getElementById('task-id').value;

    if (!title) return;
    const tasks = getUserTasks(currentUser.email);

    if (taskId) {
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index].title = title;
            tasks[index].description = description;
            tasks[index].category = category;
            tasks[index].priority = priority;
            tasks[index].dueDate = dueDate;
        }
    } else {
        tasks.unshift({
            id: 'task-' + Date.now(),
            title, description, category, priority, dueDate,
            completed: false,
            createdAt: Date.now()
        });
    }

    saveUserTasks(currentUser.email, tasks);
    closeTaskModal();
    renderDashboard();
}

function editTask(id) {
    const tasks = getUserTasks(currentUser.email);
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title-input').value = task.title;
    document.getElementById('task-desc-input').value = task.description || '';
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.dueDate || '';
    document.getElementById('task-modal').classList.remove('hidden');
}

function deleteTask(id) {
    let tasks = getUserTasks(currentUser.email);
    tasks = tasks.filter(t => t.id !== id);
    saveUserTasks(currentUser.email, tasks);
    renderDashboard();
}

function clearCompletedTasks() {
    let tasks = getUserTasks(currentUser.email);
    tasks = tasks.filter(t => !t.completed);
    saveUserTasks(currentUser.email, tasks);
    renderDashboard();
}

function openTaskModal() {
    document.getElementById('modal-title').textContent = 'New Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-modal').classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
}

function closeTaskModalOnOverlay(event) {
    if (event.target.id === 'task-modal') closeTaskModal();
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
    renderDashboard();
}

function filterTasks() {
    renderDashboard();
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
