import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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
let score = 0;
let timeLeft = 20;
let timer;
let correctAnswer = null;
let gameOver = false;

window.addEventListener("DOMContentLoaded", () => {
  const problemEl = document.getElementById("problem");
  const optionsEl = document.getElementById("options");
  const resultEl = document.getElementById("result");
  const scoreEl = document.getElementById("currentScore");
  const timerEl = document.getElementById("time");
  const highScoreEl = document.getElementById("highScoreValue");
  const playCountEl = document.getElementById("playCountValue");
  const userNameEl = document.getElementById("user-name");
  const logoutLink = document.getElementById("logout-link");

  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("resetBtn").addEventListener("click", resetGame);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Please log in to play the game.");
      window.location.href = "Login.html";
      return;
    }

    currentUser = user;
    console.log("User logged in:", currentUser.uid);

    // 🔥 Load user's name from Firestore
    let displayName = "Guest";
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        displayName = userData.username || "Guest";
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }

    userNameEl.textContent = `Welcome, ${displayName}!`;
    logoutLink.style.display = "inline";

    // 🔥 Load stats from Firestore
    const sprintStatsRef = doc(db, "users", currentUser.uid, "gameStats", "sprintStats");
    const snap = await getDoc(sprintStatsRef);
    const stats = snap.exists() ? snap.data() : {};

    highScoreEl.textContent = stats.highScore || 0;
    playCountEl.textContent = stats.gamesPlayed || 0;

    // ✅ Load additional display stats
    loadMathSprintStats(currentUser.uid);
  });

  function generateProblem() {
    if (gameOver) return;

    // Randomly choose operation: addition, multiplication, or easy division
    const operations = ["addition", "multiplication", "division"];
    const op = operations[Math.floor(Math.random() * operations.length)];

    if (op === "addition") {
      generateAdditionProblem();
    } else if (op === "multiplication") {
      generateMultiplicationProblem();
    } else if (op === "division") {
      generateDivisionProblem();
    }
  }

  function generateAdditionProblem() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    correctAnswer = a + b;
    problemEl.textContent = `${a} + ${b} = ?`;

    const options = [correctAnswer];
    while (options.length < 4) {
      const wrong = correctAnswer + Math.floor(Math.random() * 10 - 5);
      if (!options.includes(wrong) && wrong > 0) options.push(wrong);
    }

    options.sort(() => Math.random() - 0.5);
    optionsEl.innerHTML = "";

    options.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.onclick = () => checkAnswer(option);
      optionsEl.appendChild(btn);
    });
  }

  function generateMultiplicationProblem() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    correctAnswer = a * b;
    problemEl.textContent = `${a} × ${b} = ?`;

    const options = [correctAnswer];
    while (options.length < 4) {
      const wrong = correctAnswer + Math.floor(Math.random() * 20 - 10);
      if (!options.includes(wrong) && wrong >= 0) options.push(wrong);
    }

    options.sort(() => Math.random() - 0.5);
    optionsEl.innerHTML = "";

    options.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.onclick = () => checkAnswer(option);
      optionsEl.appendChild(btn);
    });
  }

  function generateDivisionProblem() {
    const divisor = Math.floor(Math.random() * 8) + 2;
    const multiplier = Math.floor(Math.random() * 10) + 1;
    const dividend = divisor * multiplier;

    correctAnswer = multiplier;
    problemEl.textContent = `${dividend} ÷ ${divisor} = ?`;

    const options = [correctAnswer];
    while (options.length < 4) {
      const wrong = correctAnswer + Math.floor(Math.random() * 5 - 2);
      if (!options.includes(wrong) && wrong > 0) options.push(wrong);
    }

    options.sort(() => Math.random() - 0.5);
    optionsEl.innerHTML = "";

    options.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.onclick = () => checkAnswer(option);
      optionsEl.appendChild(btn);
    });
  }

  function checkAnswer(selected) {
    if (gameOver) return;

    if (selected === correctAnswer) {
      score += 1;
      scoreEl.textContent = score;
      resultEl.textContent = "Correct!";
    } else {
      resultEl.textContent = "Wrong!";
    }

    generateProblem();
  }

  function startGame() {
    score = 0;
    timeLeft = 20;
    gameOver = false;
    scoreEl.textContent = score;
    resultEl.textContent = "";
    timerEl.textContent = timeLeft;
    generateProblem();

    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        endGame();
      }
    }, 1000);
  }

  async function endGame() {
    gameOver = true;
    resultEl.textContent = "Time's up!";

    const buttons = optionsEl.querySelectorAll("button");
    buttons.forEach(btn => btn.disabled = true);

    if (!currentUser) return;

    const sprintStatsRef = doc(db, "users", currentUser.uid, "gameStats", "sprintStats");

    try {
      const snap = await getDoc(sprintStatsRef);
      const data = snap.exists() ? snap.data() : {};

      const prevHighScore = data.highScore || 0;
      const prevPlayCount = data.gamesPlayed || 0;

      const newHighScore = Math.max(score, prevHighScore);

      highScoreEl.textContent = newHighScore;
      playCountEl.textContent = prevPlayCount + 1;

      const updates = {
        gamesPlayed: increment(1),
      };

      if (score > prevHighScore) {
        updates.highScore = newHighScore;
      }

      await updateDoc(sprintStatsRef, updates);
      console.log("Updated stats saved:", updates);
    } catch (err) {
      console.error("Error saving stats:", err);
    }
  }

  function resetGame() {
    clearInterval(timer);
    score = 0;
    timeLeft = 20;
    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;
    resultEl.textContent = "";
    optionsEl.innerHTML = "";
    problemEl.textContent = "";
    gameOver = false;
  }
});