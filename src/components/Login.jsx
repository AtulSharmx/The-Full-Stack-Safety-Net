import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import "./Login.css";

const googleProvider = new GoogleAuthProvider();

function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid email or password.");
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Please enter your email address first.");
      setMessage("");
      return;
    }
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Could not send reset email.");
    }
  }

  return (
    <div className="auth-card">
      <h2>Log In</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="forgot-wrapper">
          <span className="forgot-link" onClick={handleForgotPassword}>
            Forgot Password?
          </span>
        </div>
        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}
        <button type="submit">Log In</button>
      </form>
      <div className="divider"><span>or</span></div>
      <button className="google-btn" onClick={handleGoogleLogin}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Continue with Google
      </button>
      <p className="switch-link">
        Don't have an account?{" "}
        <span onClick={onSwitch}>Sign up</span>
      </p>
    </div>
  );
}

export default Login;
