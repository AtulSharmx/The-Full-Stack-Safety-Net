import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import AddTaskForm from "./AddTaskForm";
import TaskItem from "./TaskItem";
import "./TaskList.css";

function TaskList({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTasks(showLoading = false) {
    if (showLoading) setIsLoading(true);
    // Only fetch tasks that belong to the currently logged-in user
    const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
    try {
      const snapshot = await getDocs(q);
      const taskData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTasks(taskData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTasks(true);
  }, []);

  async function handleAddTask(text, dueDate) {
    const tempId = "temp-" + Date.now();
    const newTask = { id: tempId, text, dueDate, completed: false, userId: currentUser.uid };
    setTasks((prev) => [newTask, ...prev]);

    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        text,
        dueDate,
        completed: false,
        userId: currentUser.uid,
      });
      setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: docRef.id } : t)));
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  async function handleToggleTask(task) {
    const nextStatus = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextStatus } : t)));

    try {
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { completed: nextStatus });
    } catch (err) {
      console.error(err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  }

  async function handleDeleteTask(taskId) {
    const backupTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);
    } catch (err) {
      console.error(err);
      setTasks(backupTasks);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="task-list-page">
      <header className="task-header">
        <div className="header-brand">
          <h1>My Tasks</h1>
          <span className="user-badge">{currentUser.email}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="task-content">
        <AddTaskForm onAddTask={handleAddTask} />

        {isLoading ? (
          <div className="status-msg">Loading tasks...</div>
        ) : (
          <>
            <section className="task-section">
              <div className="section-title-row">
                <h2>Pending</h2>
                <span className="count-badge pending-badge">{pendingTasks.length}</span>
              </div>
              {pendingTasks.length === 0 ? (
                <p className="empty-msg">No pending tasks. You're all caught up!</p>
              ) : (
                pendingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </section>

            <section className="task-section">
              <div className="section-title-row">
                <h2>Completed</h2>
                <span className="count-badge done-badge">{completedTasks.length}</span>
              </div>
              {completedTasks.length === 0 ? (
                <p className="empty-msg">No completed tasks yet.</p>
              ) : (
                completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskList;
