import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  deleteUser
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("You must be logged in to view this page.");
      window.location.href = "Login.html";
      return;
    }
    currentUser = user;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("User data not found.");
        return;
      }

      const data = userSnap.data();

      // Show profile info
      document.getElementById("profileUsername").textContent = data.username || "Guest";
      document.getElementById("usernameInput").value = data.username || "";

      document.getElementById("profileEmail").textContent = user.email;
      document.getElementById("emailInput").value = user.email;

      document.getElementById("profilePassword").textContent = "********";
      document.getElementById("passwordInput").value = "";

      // Load game stats
      await loadBubbleMathStats(user.uid);
      await loadMathSprintStats(user.uid);

      // Setup editable fields
      setupEditButton("Username", async (newVal) => {
        await updateDoc(userRef, { username: newVal });
        return newVal;
      });

      setupEditButton("Email", async (newVal) => {
        try {
          await updateEmail(user, newVal);
          await updateDoc(userRef, { email: newVal });
          return newVal;
        } catch (err) {
          if (err.code === 'auth/requires-recent-login') {
            alert("You need to re-authenticate before changing your email. Please log out and log back in.");
          }
          throw err;
        }
      });

      setupEditButton("Password", async (newVal) => {
        try {
          await updatePassword(user, newVal);
          return "********";
        } catch (err) {
          if (err.code === 'auth/requires-recent-login') {
            alert("You need to re-authenticate before changing your password. Please log out and log back in.");
          }
          throw err;
        }
      });

      // Delete account button
      document.getElementById("deleteAccountBtn").onclick = async () => {
        if (!confirm("Are you sure you want to permanently delete your account?")) return;

        try {
          await deleteDoc(userRef);
          // Note: If you have subcollections (like gameStats), you must delete them separately.
          await deleteUser(user);
          alert("Account deleted successfully.");
          window.location.href = "Login.html";
        } catch (e) {
          if (e.code === 'auth/requires-recent-login') {
            alert("You need to re-authenticate before deleting your account. Please log out and log back in.");
          } else {
            alert("Error deleting account: " + e.message);
          }
        }
      };

    } catch (err) {
      alert("Error loading profile: " + err.message);
    }
  });
});

function setupEditButton(fieldName, updateCallback) {
  const spanEl = document.getElementById(`profile${fieldName}`);
  const inputEl = document.getElementById(`${fieldName.toLowerCase()}Input`);
  const btnEl = document.getElementById(`edit${fieldName}Btn`);

  btnEl.onclick = async () => {
    if (btnEl.textContent === "Edit") {
      // Switch to edit mode
      inputEl.style.display = "inline-block";
      spanEl.style.display = "none";
      btnEl.textContent = "Save";
      inputEl.focus();
    } else {
      // Save mode
      const newVal = inputEl.value.trim();
      if (!newVal) {
        alert(`${fieldName} cannot be empty.`);
        return;
      }
      btnEl.disabled = true;
      try {
        const updatedVal = await updateCallback(newVal);
        spanEl.textContent = updatedVal;
        inputEl.style.display = "none";
        spanEl.style.display = "inline";
        btnEl.textContent = "Edit";
      } catch (err) {
        alert(`Failed to update ${fieldName}: ${err.message}`);
      } finally {
        btnEl.disabled = false;
      }
    }
  };
}

async function loadBubbleMathStats(userId) {
  try {
    const statsRef = doc(db, "users", userId, "gameStats", "bubbleMathStats");
    const statsSnap = await getDoc(statsRef);

    const difficulties = ["easy", "intermediate", "hard"];

    if (!statsSnap.exists()) {
      // Reset all stats to default if no data
      difficulties.forEach(diff => {
        document.getElementById(`${diff}TotalMatches`).textContent = "0";
        document.getElementById(`${diff}WinRate`).textContent = "0%";
        document.getElementById(`${diff}BestCompletionTime`).textContent = "N/A";
      });
      return;
    }

    const stats = statsSnap.data();

    difficulties.forEach(diff => {
      const s = stats[diff] || {};

      const totalMatches = s.totalMatches || 0;
      const winCount = s.winCount || 0;

      // Calculate win rate percentage (avoid div by zero)
      let winRate = 0;
      if (totalMatches > 0) {
        winRate = (winCount / totalMatches) * 100;
      }

      let bestTime = "N/A";
      if (typeof s.bestCompletionTime === "number" && s.bestCompletionTime > 0) {
        bestTime = s.bestCompletionTime.toFixed(2) + "s";
      }

      document.getElementById(`${diff}TotalMatches`).textContent = totalMatches;
      document.getElementById(`${diff}WinRate`).textContent = winRate.toFixed(1) + "%";
      document.getElementById(`${diff}BestCompletionTime`).textContent = bestTime;
    });

  } catch (error) {
    console.error("Error loading Bubble Math stats:", error);
  }
}

async function loadMathSprintStats(userId) {
  if (!userId) {
    console.warn("loadMathSprintStats called without userId");
    return;
  }

  const totalMatchesElem = document.getElementById("sprintTotalMatches");
  const highScoreElem = document.getElementById("sprintHighScore");

  if (!totalMatchesElem || !highScoreElem) {
    console.error("Required DOM elements for sprint stats not found.");
    return;
  }

  try {
    const sprintRef = doc(db, "users", userId, "gameStats", "sprintStats");
    const sprintSnap = await getDoc(sprintRef);

    if (!sprintSnap.exists()) {
      totalMatchesElem.textContent = "0";
      highScoreElem.textContent = "0";
      return;
    }

    const data = sprintSnap.data();

    const matchesPlayed = typeof data.gamesPlayed === "number" ? data.gamesPlayed : 0;
    const bestScore = typeof data.highScore === "number" ? data.highScore : 0;

    totalMatchesElem.textContent = matchesPlayed.toString();
    highScoreElem.textContent = bestScore.toString();

  } catch (error) {
    console.error("Error loading Math Sprint stats:", error);
    totalMatchesElem.textContent = "0";
    highScoreElem.textContent = "0";
  }
}

