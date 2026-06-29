import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebaseConfig";
import Login from "./components/Login";
import Signup from "./components/Signup";
import TaskList from "./components/TaskList";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes so we know if a user is signed in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="auth-wrapper">
        {authView === "login" ? (
          <Login onSwitch={() => setAuthView("signup")} />
        ) : (
          <Signup onSwitch={() => setAuthView("login")} />
        )}
      </div>
    );
  }

  return <TaskList currentUser={currentUser} />;
}

export default App;
