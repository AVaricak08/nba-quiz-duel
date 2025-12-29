const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const fs = require("fs");
const questions = JSON.parse(fs.readFileSync("server/questions.json"));

app.use(express.static("public"));

// Score tracking
let scores = {1: 0, 2: 0};
let currentQuestion = null;
let questionAnswered = false;

io.on("connection", (socket) => {
    let playerNumber = Object.keys(io.sockets.sockets).length; // 1 ili 2
    socket.emit("player-number", playerNumber);

    // Send first question when player connects
    if (!currentQuestion) sendQuestion();

    socket.on("answer", (answerIdx) => {
        if (questionAnswered) return; // samo prvi
        questionAnswered = true;

        if (answerIdx === currentQuestion.correct) {
            scores[playerNumber]++;
            io.emit("status-update", `Player ${playerNumber} scored!`);
        } else {
            let other = playerNumber === 1 ? 2 : 1;
            scores[other]++;
            io.emit("status-update", `Player ${playerNumber} answered wrong. Player ${other} scores!`);
        }

        io.emit("score-update", scores);

        // Check for winner
        if (scores[1] >= 11) io.emit("status-update", "Player 1 wins!");
        else if (scores[2] >= 11) io.emit("status-update", "Player 2 wins!");
        else setTimeout(sendQuestion, 1000); // next question after 1s
    });
});

function sendQuestion() {
    questionAnswered = false;
    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    io.emit("new-question", currentQuestion);
}

// RADI I NA RAILWAY I LOKALNO
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
