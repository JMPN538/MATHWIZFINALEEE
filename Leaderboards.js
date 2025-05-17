import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
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
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  loadBubbleMathLeaderboard("easy", "bubble-easy-body");
  loadBubbleMathLeaderboard("intermediate", "bubble-intermediate-body");
  loadBubbleMathLeaderboard("hard", "bubble-hard-body");
  loadSprintLeaderboard();
});

async function loadBubbleMathLeaderboard(difficulty, tableBodyId) {
  const usersSnap = await getDocs(collection(db, "users"));
  const leaderboard = [];

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const username = userData.username || "Unknown";

    const statsRef = doc(db, "users", userId, "gameStats", "bubbleMathStats");
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const stats = statsSnap.data();
      const diffStats = stats[difficulty];

      if (diffStats && diffStats.totalMatches > 0) {
        leaderboard.push({
          username,
          bestTime: diffStats.bestCompletionTime || 0,
          winRate: diffStats.winRate || 0
        });
      }
    }
  }

  // Sort ascending by bestTime (lower is better)
  leaderboard.sort((a, b) => {
    if (a.bestTime === 0) return 1;  // push entries with 0 bestTime to bottom
    if (b.bestTime === 0) return -1;
    return a.bestTime - b.bestTime;
  });

  const tbody = document.getElementById(tableBodyId);
  tbody.innerHTML = "";

  if (leaderboard.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" style="text-align:center;">No data available</td>`;
    tbody.appendChild(row);
    return;
  }

  leaderboard.forEach((entry, index) => {
    const bestTimeDisplay = entry.bestTime > 0 ? entry.bestTime.toFixed(2) + "s" : "N/A";
    const winRateDisplay = entry.winRate.toFixed(1) + "%";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.username}</td>
      <td>${bestTimeDisplay}</td>
      <td>${winRateDisplay}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadSprintLeaderboard() {
  const usersSnap = await getDocs(collection(db, "users"));
  const leaderboard = [];

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const username = userData.username || "Unknown";

    const statsRef = doc(db, "users", userId, "gameStats", "sprintStats");
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const stats = statsSnap.data();
      leaderboard.push({
        username,
        highScore: stats.highScore || 0
      });
    }
  }

  // Sort descending by highScore (higher is better)
  leaderboard.sort((a, b) => b.highScore - a.highScore);

  const tbody = document.getElementById("sprint-leaderboard-body");
  tbody.innerHTML = "";

  if (leaderboard.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" style="text-align:center;">No data available</td>`;
    tbody.appendChild(row);
    return;
  }

  leaderboard.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.username}</td>
      <td>${entry.highScore}</td>
    `;
    tbody.appendChild(row);
  });
}
