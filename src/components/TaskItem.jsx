import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import "./TaskItem.css";

function TaskItem({ task, onRefresh }) {
  async function handleToggle() {
    try {
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { completed: !task.completed });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    try {
      const taskRef = doc(db, "tasks", task.id);
      await deleteDoc(taskRef);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={`task-item ${task.completed ? "done" : ""}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
      />
      <div className="task-info">
        <span className="task-text">{task.text}</span>
        {task.dueDate && (
          <span className="task-due">Due: {task.dueDate}</span>
        )}
      </div>
      <button className="delete-btn" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
}

export default TaskItem;
