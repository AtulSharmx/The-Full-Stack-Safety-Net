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
    await addDoc(collection(db, "tasks"), {
      text: text.trim(),
      dueDate,
      completed: false,
      userId: currentUser.uid,
    });
    setText("");
    setDueDate("");
    onTaskAdded();
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
