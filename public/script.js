const socket = io();

let playerNumber;
let canAnswer = false;

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

// Zvukovi
const correctSound = new Audio("/sounds/correct.mp3");
const wrongSound = new Audio("/sounds/wrong.mp3");

socket.on("player-number", (num) => {
    playerNumber = num;
    statusEl.innerText = `You are Player ${playerNumber}`;
});

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

    statusEl.innerText = "You have 10 seconds!";
    setTimeout(() => {
        canAnswer = false;
    }, 10000); // 10 sekundi
});

function answerQuestion(idx) {
    if (!canAnswer) return;
    canAnswer = false;
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
