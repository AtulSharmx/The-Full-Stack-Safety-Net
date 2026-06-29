import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import AddTaskForm from "./AddTaskForm";
import TaskItem from "./TaskItem";
import "./TaskList.css";

function TaskList({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTasks() {
    setIsLoading(true);
    // Only fetch tasks that belong to the currently logged-in user
    const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    const taskData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setTasks(taskData);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleLogout() {
    await signOut(auth);
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="task-list-page">
      <header className="task-header">
        <h1>My Tasks</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="task-content">
        <AddTaskForm currentUser={currentUser} onTaskAdded={loadTasks} />

        {isLoading ? (
          <p className="status-msg">Loading tasks...</p>
        ) : (
          <>
            <section className="task-section">
              <h2>Pending</h2>
              {pendingTasks.length === 0 ? (
                <p className="empty-msg">No pending tasks</p>
              ) : (
                pendingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onRefresh={loadTasks} />
                ))
              )}
            </section>

            <section className="task-section">
              <h2>Completed</h2>
              {completedTasks.length === 0 ? (
                <p className="empty-msg">No completed tasks</p>
              ) : (
                completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onRefresh={loadTasks} />
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
