import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import "./AddTaskForm.css";

function AddTaskForm({ currentUser, onTaskAdded }) {
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    const taskText = text.trim();
    const taskDate = dueDate;

    // Clear form instantly - 0 millisecond delay for user
    setText("");
    setDueDate("");

    try {
      await addDoc(collection(db, "tasks"), {
        text: taskText,
        dueDate: taskDate,
        completed: false,
        userId: currentUser.uid,
      });
      onTaskAdded();
    } catch (err) {
      console.error(err);
    }
  }

  return (
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
      <button type="submit">Add Task</button>
    </form>
  );
}

export default AddTaskForm;
