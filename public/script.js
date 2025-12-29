const socket = io();

let playerNumber;
let canAnswer = false;

const questionEl = document.getElementById("question");
const answersEl = document.getElementById("answers");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

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

    statusEl.innerText = "You have 3 seconds!";
    setTimeout(() => {
        canAnswer = false;
        statusEl.innerText = "Time's up!";
    }, 3000);
});

function answerQuestion(idx) {
    if (!canAnswer) return;
    canAnswer = false; // samo prvi klik
    socket.emit("answer", idx);
}

socket.on("score-update", (data) => {
    scoreEl.innerText = `Player 1: ${data[1]} | Player 2: ${data[2]}`;
});

socket.on("status-update", (msg) => {
    statusEl.innerText = msg;
});
