import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import "./AddTaskForm.css";

function AddTaskForm({ currentUser, onTaskAdded }) {
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "tasks"), {
        text: text.trim(),
        dueDate,
        completed: false,
        userId: currentUser.uid,
        createdAt: Date.now(),
      });
      setText("");
      setDueDate("");
      onTaskAdded();
    } catch (err) {
      setError(err.message || "Failed to add task. Please check Firestore permissions.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="add-task-container">
      <form className="add-task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Task"}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default AddTaskForm;
