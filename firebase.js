// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjEYMTYWdzKyuy-cmF3FGA2JuqvMJaPu0",
  authDomain: "login-f9ba4.firebaseapp.com",
  projectId: "login-f9ba4",
  storageBucket: "login-f9ba4.appspot.com",
  messagingSenderId: "632573907319",
  appId: "1:632573907319:web:4a5ed83dd0390a2b4f1172"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// SIGN UP
const signUpBtn = document.getElementById("signUpBtn");
if (signUpBtn) {
  signUpBtn.addEventListener("click", async () => {
    const username = document.querySelector("input[name='username']").value.trim();
    const email = document.querySelector("input[name='email']").value.trim();
    const password = document.querySelector("input[name='password']").value;
    const confirmPassword = document.querySelector("input[name='confirm-password']").value;

    if (!username || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        createdAt: new Date()
      });

      alert("Account created successfully!");
      window.location.href = "Main Menu.html"; // ✅ Redirect after sign-up
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Error: " + error.message);
    }
  });
}

// SIGN IN
const loginBtn = document.getElementById("loginButton");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "HomePageWithUser.html"; // ✅ Redirect after sign-in
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
