// HomePageWithUser.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config
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
const db = getFirestore(app);


window.addEventListener("DOMContentLoaded", () => {
  const userNameSpan = document.getElementById("user-name");
  const logoutLink = document.getElementById("logout-link");


  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userNameSpan.textContent = `Welcome, ${userData.username}!`;
        } else {
          userNameSpan.textContent = "Welcome!";
        }
        logoutLink.style.display = "inline";
      } catch (error) {
        console.error("Error fetching user data:", error);
        userNameSpan.textContent = "Welcome!";
      }
    } else {
      // Not logged in
      userNameSpan.textContent = "Welcome, Guest!";
      logoutLink.style.display = "none";
    }
  });

  // Handle logout
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      window.location.href = "Home.html";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  });
});
