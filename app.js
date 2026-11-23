let currentUser = null;
let currentFilter = 'all';

// The sample task sits a couple of days out, so a new account does not open
// on something that is already overdue.
const DEFAULT_DUE_DATE = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

const DEFAULT_TASKS = [
    { 
        id: 'task-1', 
        title: 'Review workflow rules', 
        description: 'Configure priority alerts for projects.',
        category: 'Work', 
        priority: 'High', 
        dueDate: DEFAULT_DUE_DATE, 
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
    // DEFAULT_TASKS is shared module state and callers mutate the array they
    // get back, so the fallback hands over copies rather than the originals.
    return data ? JSON.parse(data) : DEFAULT_TASKS.map((task) => ({ ...task }));
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

    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && b.dueDate) {
            const diff = new Date(a.dueDate) - new Date(b.dueDate);
            if (diff !== 0) return diff;
        } else if (a.dueDate) {
            return -1;
        } else if (b.dueDate) {
            return 1;
        }

        const priorityValue = { High: 1, Medium: 2, Low: 3 };
        return (priorityValue[a.priority] || 4) - (priorityValue[b.priority] || 4);
    });

    const taskListEl = document.getElementById('task-list');
    const emptyStateEl = document.getElementById('empty-state');
    taskListEl.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyStateEl.classList.remove('hidden');
    } else {
        emptyStateEl.classList.add('hidden');
        filteredTasks.forEach(task => {
            const dueSoonClass = !task.completed && isDueSoon(task.dueDate) ? ' due-soon' : '';
            const card = document.createElement('div');
            card.className = `task-card ${task.completed ? 'completed' : ''}${dueSoonClass}`;
            card.innerHTML = `
                <div class="task-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskComplete('${task.id}')">
                    <div class="task-details">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        ${task.description ? `<span class="task-desc">${escapeHtml(task.description)}</span>` : ''}
                        <div class="task-meta">
                            <span>${escapeHtml(task.category)}</span> • 
                            <span>${escapeHtml(task.priority)} Priority</span>
                            ${task.dueDate ? ` • <span>${escapeHtml(task.dueDate)}</span>` : ''}
                        </div>
                        ${isDueSoon(task.dueDate) ? '<span class="due-soon-badge">Due soon</span>' : ''}
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

function openTaskModal() {
    document.getElementById('modal-title').textContent = 'New Task';
    document.getElementById('task-id').value = '';
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-desc-input').value = '';
    document.getElementById('task-category').value = 'Work';
    document.getElementById('task-priority').value = 'Medium';
    document.getElementById('task-due-date').value = '';
    document.getElementById('task-modal').classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('task-form').reset();
    document.getElementById('task-modal').classList.add('hidden');
}

function closeTaskModalOnOverlay(event) {
    if (event.target.id === 'task-modal') {
        closeTaskModal();
    }
}

function filterTasks() {
    renderDashboard();
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(button => {
        button.classList.toggle('active', button.dataset.filter === filter);
    });
    renderDashboard();
}

function clearCompletedTasks() {
    const tasks = getUserTasks(currentUser.email).filter(task => !task.completed);
    saveUserTasks(currentUser.email, tasks);
    showToast('Completed tasks cleared');
    renderDashboard();
}

function isDueSoon(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate + 'T23:59:59');
    const diffMs = due - today;
    return diffMs >= 0 && diffMs <= 3 * 24 * 60 * 60 * 1000;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 2500);
}
