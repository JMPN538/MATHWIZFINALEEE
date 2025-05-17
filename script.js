import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config and initialization
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

// Game state variables
let target = 0;
let score = 0;
let gameInterval;
let timerInterval;
let level = 1;
let timeLeft = 0;
let gameOver = false;

// DOM Elements
let gameArea, targetDisplay, scoreDisplay, difficultySelect, userNameSpan, logoutLink, startBtn;

window.addEventListener('DOMContentLoaded', () => {
  gameArea = document.getElementById("bubbleGameArea");
  targetDisplay = document.getElementById("targetDisplay");
  scoreDisplay = document.getElementById("scoreDisplay");
  difficultySelect = document.getElementById("difficulty");
  userNameSpan = document.getElementById('user-name');
  logoutLink = document.getElementById('logout-link');
  startBtn = document.getElementById('startBtn');

  // Listen to auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        userNameSpan.textContent = `Welcome, ${userDoc.exists() ? (userDoc.data().username || user.email) : user.email}!`;
        logoutLink.style.display = "inline";
      } catch {
        userNameSpan.textContent = `Welcome, ${user.email}!`;
      }
    } else {
      userNameSpan.textContent = "Welcome, Guest!";
      logoutLink.style.display = "none";
    }
  });

  logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      window.location.href = 'Home.html';
    } catch (error) {
      console.error("Logout failed", error);
    }
  });

  startBtn.addEventListener('click', startGame);
});

function startGame() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  gameOver = false;

  level = parseInt(difficultySelect.value);
  score = 0;
  updateScoreDisplay();
  gameArea.innerHTML = "";

  timeLeft = level === 1 ? 60 : level === 2 ? 45 : 30;
  updateTimerDisplay();

  const timerDiv = document.createElement("div");
  timerDiv.id = "timer";
  timerDiv.style.color = "white";
  timerDiv.style.padding = "10px";
  timerDiv.style.fontWeight = "bold";
  timerDiv.textContent = `Time Left: ${timeLeft}`;
  gameArea.appendChild(timerDiv);

  target = generateTargetNumber(level);
  targetDisplay.textContent = `Target: ${target}`;

  // Clear game message at start
  const gameMessage = document.getElementById("gameMessage");
  if (gameMessage) gameMessage.textContent = "";

  timerInterval = setInterval(() => {
    if (gameOver) {
      clearInterval(timerInterval);
      return;
    }
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);

  const spawnRate = level === 1 ? 1000 : level === 2 ? 500 : 250;
  gameInterval = setInterval(() => {
    if (gameOver) {
      clearInterval(gameInterval);
      return;
    }
    const bubble = createBubble(level);
    gameArea.appendChild(bubble);
  }, spawnRate);
}

function updateTimerDisplay() {
  const timerDiv = document.getElementById("timer");
  if (timerDiv) timerDiv.textContent = `Time Left: ${timeLeft}`;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Current Total: ${score}`;
}

function generateTargetNumber(level) {
  if (level === 1) return Math.floor(Math.random() * 30) + 20;
  if (level === 2) return Math.floor(Math.random() * 50) + 40;
  if (level === 3) return Math.floor(Math.random() * 80) + 60;
  return 0;
}

function createBubble(level) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.style.left = `${Math.random() * 90}%`;

  let value;
  if (level === 1) {
    value = Math.floor(Math.random() * 9) + 1;
  } else if (level === 2) {
    value = Math.random() < 0.5
      ? Math.floor(Math.random() * 9) + 1
      : Math.floor(Math.random() * 90) + 10;
  } else {
    const rand = Math.random();
    value = rand < 0.33
      ? Math.floor(Math.random() * 9) + 1
      : rand < 0.66
      ? Math.floor(Math.random() * 90) + 10
      : Math.floor(Math.random() * 900) + 100;
  }

  bubble.textContent = value;
  bubble.onclick = () => {
    if (gameOver) return;
    score += value;
    updateScoreDisplay();
    bubble.remove();
    checkWinCondition();
  };

  const fallTime = level === 1 ? 5 : level === 2 ? 2.5 : 2;
  bubble.style.animation = `fall ${fallTime}s linear forwards`;

  setTimeout(() => {
    if (bubble.parentElement) bubble.remove();
  }, fallTime * 1000);

  return bubble;
}

function checkWinCondition() {
  if (score > target) {
    endGame(false);
  } else if (score === target) {
    endGame(true);
  }
}

async function endGame(win) {
  gameOver = true;

  clearInterval(gameInterval);
  clearInterval(timerInterval);

  // Disable bubbles clicking after game ends
  const bubbles = document.querySelectorAll(".bubble");
  bubbles.forEach(bubble => bubble.onclick = null);

  const difficulty = level === 1 ? "easy" : level === 2 ? "intermediate" : "hard";

  // Update in-game message instead of alert
  const gameMessage = document.getElementById("gameMessage");
  if (gameMessage) {
    if (win) {
      gameMessage.textContent = `You win! Your final score is ${score}.`;
    } else {
      gameMessage.textContent = `Game Over! Your final score is ${score}.`;
    }
  }

  // Update user stats in Firestore
  await updateUserStats(win, level, timeLeft);

  // Reset UI: clear bubbles, reset score, timer and target displays
  gameArea.innerHTML = "";
  score = 0;
  updateScoreDisplay();
  targetDisplay.textContent = "Target: -";
  const timerDiv = document.getElementById("timer");
  if (timerDiv) timerDiv.textContent = "Time Left: 0";
}

async function updateUserStats(win, level, timeLeft) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user logged in, skipping stats update");
    return;
  }

  const difficulty = level === 1 ? "easy" : level === 2 ? "intermediate" : "hard";
  const totalTime = level === 1 ? 60 : level === 2 ? 45 : 30;
  const elapsedTime = totalTime - timeLeft;

  const bubbleStatsRef = doc(db, "users", user.uid, "gameStats", "bubbleMathStats");

  try {
    const docSnap = await getDoc(bubbleStatsRef);
    const allStats = docSnap.exists() ? docSnap.data() : {};

    if (!allStats[difficulty]) {
      allStats[difficulty] = {
        totalMatches: 0,
        winCount: 0,
        bestCompletionTime: 0,
        winRate: 0
      };
    }

    allStats[difficulty].totalMatches++;

    if (win) {
      allStats[difficulty].winCount++;
      if (allStats[difficulty].bestCompletionTime === 0 || elapsedTime < allStats[difficulty].bestCompletionTime) {
        allStats[difficulty].bestCompletionTime = elapsedTime;
      }
    }

    allStats[difficulty].winRate = allStats[difficulty].totalMatches > 0
      ? Number(((allStats[difficulty].winCount / allStats[difficulty].totalMatches) * 100).toFixed(1))
      : 0;

    if ("lossCount" in allStats[difficulty]) {
      delete allStats[difficulty].lossCount;
    }

    await setDoc(bubbleStatsRef, allStats, { merge: true });
    console.log("Bubble Math stats updated successfully.");
  } catch (error) {
    console.error("Error updating bubble math stats:", error);
  }
}
