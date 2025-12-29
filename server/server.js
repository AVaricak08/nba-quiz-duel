const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const questions = require("./questions.json");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let players = {};
let scores = { 1: 0, 2: 0 };
let currentQuestion = null;
let answered = false;

io.on("connection", (socket) => {
    if (Object.keys(players).length < 2) {
        const playerNumber = Object.keys(players).length + 1;
        players[socket.id] = playerNumber;
        socket.emit("player-number", playerNumber);
    }

    if (Object.keys(players).length === 2) {
        sendQuestion();
    }

    socket.on("answer", (index) => {
        if (answered) return;
        answered = true;

        const player = players[socket.id];
        const opponent = player === 1 ? 2 : 1;

        if (index === currentQuestion.correct) {
            scores[player]++;
            io.emit("attack", { player });
        } else {
            scores[opponent]++;
            io.emit("attack", { player: opponent });
        }

        io.emit("score-update", scores);

        if (scores[player] === 11 || scores[opponent] === 11) {
            io.emit("winner", player);
            scores = { 1: 0, 2: 0 };
        }

        setTimeout(sendQuestion, 2000);
    });

    socket.on("disconnect", () => {
        players = {};
        scores = { 1: 0, 2: 0 };
    });
});

function sendQuestion() {
    answered = false;
    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    io.emit("question", currentQuestion);
}

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
