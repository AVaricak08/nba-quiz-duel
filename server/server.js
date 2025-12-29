const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const fs = require("fs");
const questions = JSON.parse(fs.readFileSync("server/questions.json"));

app.use(express.static("public"));

// GLOBALNI BROJAČ IGRAČA
let playerCount = 0;

// Score tracking
let scores = {1: 0, 2: 0};
let currentQuestion = null;
let questionAnswered = false;
let questionTimeout = null;
let showAnswerTimeout = null;

io.on("connection", (socket) => {
    playerCount++;
    let playerNumber = playerCount;
    socket.emit("player-number", playerNumber);

    console.log(`Player ${playerNumber} connected`);

    socket.on("disconnect", () => {
        playerCount--;
        console.log(`Player ${playerNumber} disconnected`);
    });

    if (!currentQuestion) sendQuestion();

    socket.on("answer", (answerIdx) => {
        if (questionAnswered) return;
        questionAnswered = true;

        clearTimeout(questionTimeout);
        clearTimeout(showAnswerTimeout);

        if (answerIdx === currentQuestion.correct) {
            scores[playerNumber]++;
            io.emit("status-update", `Player ${playerNumber} scored!`);
        } else {
            let other = playerNumber === 1 ? 2 : 1;
            scores[other]++;
            io.emit("status-update", `Player ${playerNumber} answered wrong. Player ${other} scores!`);
        }

        io.emit("score-update", scores);

        if (scores[1] >= 11) io.emit("status-update", "Player 1 wins!");
        else if (scores[2] >= 11) io.emit("status-update", "Player 2 wins!");
        else {
            // prikazujemo odgovor 3 sekunde pre nego što pošaljemo novo pitanje
            showAnswerTimeout = setTimeout(() => sendQuestion(), 3000);
        }
    });
});

function sendQuestion() {
    questionAnswered = false;
    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    io.emit("new-question", currentQuestion);

    if (questionTimeout) clearTimeout(questionTimeout);
    if (showAnswerTimeout) clearTimeout(showAnswerTimeout);

    questionTimeout = setTimeout(() => {
        if (!questionAnswered) {
            questionAnswered = true;
            io.emit("status-update", `Time's up! Correct answer: ${currentQuestion.answers[currentQuestion.correct]}`);
            showAnswerTimeout = setTimeout(() => sendQuestion(), 3000);
        }
    }, 10000); // 10 sekundi
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
