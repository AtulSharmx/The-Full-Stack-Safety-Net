import "./TaskItem.css";

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className={`task-item ${task.completed ? "done" : ""}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
      />
      <div className="task-info">
        <span className="task-text">{task.text}</span>
        {task.dueDate && (
          <span className="task-due">📅 {task.dueDate}</span>
        )}
      </div>
      <button className="delete-btn" onClick={() => onDelete(task.id)}>
        Delete
      </button>
    </div>
  );
}

export default TaskItem;
