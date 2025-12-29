const socket = io();

let playerNumber;
let canAnswer = false;
let countdownInterval = null;
let nickname = "";

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const recordEl = document.getElementById("record");

const nicknameInput = document.getElementById("nicknameInput");
const setNicknameBtn = document.getElementById("setNicknameBtn");
const loginDiv = document.getElementById("login");
const readyDiv = document.getElementById("readyDiv");
const readyBtn = document.getElementById("readyBtn");
const readyStatus = document.getElementById("readyStatus");
const mainGame = document.getElementById("mainGame");

// Zvukovi
const correctSound = new Audio("/sounds/correct.mp3");
const wrongSound = new Audio("/sounds/wrong.mp3");

// Login nickname
setNicknameBtn.onclick = () => {
    const name = nicknameInput.value.trim();
    if (!name) { alert("Please enter a nickname"); return; }
    nickname = name;
    socket.emit("set-nickname", nickname);
    loginDiv.style.display = "none";
    readyDiv.style.display = "block";
};

// Klik na ready dugme
readyBtn.onclick = () => {
    socket.emit("player-ready");
    readyBtn.disabled = true;
    readyStatus.innerText = "Waiting for other player...";
};

// Update spremnosti
socket.on("update-ready-status", (numReady) => {
    readyStatus.innerText = `${numReady}/2 players ready`;
    if (numReady === 2) {
        readyDiv.style.display = "none";
        mainGame.style.display = "block";
    }
});

// Player number
socket.on("player-number", (num) => {
    playerNumber = num;
    statusEl.innerText = `You are Player ${playerNumber} (${nickname})`;
});

socket.on("update-record", (data) => {
    recordEl.innerText = `Wins: ${data.wins} | Losses: ${data.losses}`;
});

// New question
socket.on("new-question", (data) => {
    questionEl.innerText = data.q;
    answersEl.innerHTML = "";
    canAnswer = true;

    data.answers.forEach((ans, idx) => {
        const btn = document.createElement("button");
        btn.innerText = ans;
        btn.onclick = () => answerQuestion(idx);
        answersEl.appendChild(btn);
    });

    // Tajmer 10s
    let timeLeft = 10;
    timerEl.innerText = `${timeLeft}s`;
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = `${timeLeft}s`;
        if (timeLeft <= 3) timerEl.classList.add("warning");
        else timerEl.classList.remove("warning");

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            canAnswer = false;
        }
    }, 1000);
});

function answerQuestion(idx) {
    if (!canAnswer) return;
    canAnswer = false;
    clearInterval(countdownInterval);
    socket.emit("answer", idx);
}

socket.on("score-update", (data) => {
    scoreEl.innerText = `Player 1: ${data[1]} | Player 2: ${data[2]}`;
    scoreEl.classList.add("flash-score");
    setTimeout(() => scoreEl.classList.remove("flash-score"), 300);
});

socket.on("status-update", (msg) => {
    statusEl.innerText = msg;

    if (msg.includes("scored")) correctSound.play();
    if (msg.includes("wrong") || msg.includes("Time's up")) wrongSound.play();
});
