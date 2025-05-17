// firebase-login.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjEYMTYWdzKyuy-cmF3FGA2JuqvMJaPu0",
  authDomain: "login-f9ba4.firebaseapp.com",
  projectId: "login-f9ba4",
  storageBucket: "login-f9ba4.appspot.com",
  messagingSenderId: "632573907319",
  appId: "1:632573907319:web:4a5ed83dd0390a2b4f1172"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sign In Button Logic
const loginBtn = document.getElementById("loginButton");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to HomePageWithUser.html on success
      window.location.href = "HomePageWithUser.html";
    } catch (error) {
      console.error("Login Error:", error);
      if (errorMessage) {
        errorMessage.style.display = "block";
      } else {
        alert("Login failed. Please check your credentials.");
      }
    }
  });
}
