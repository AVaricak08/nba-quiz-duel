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

io.on("connection", (socket) => {
    playerCount++;
    let playerNumber = playerCount;
    socket.emit("player-number", playerNumber);

    console.log(`Player ${playerNumber} connected`);

    // Kada igrač izađe, smanjuj brojač
    socket.on("disconnect", () => {
        playerCount--;
        console.log(`Player ${playerNumber} disconnected`);
    });

    // Početno pitanje kada se prvi igrač konektuje
    if (!currentQuestion) sendQuestion();

    socket.on("answer", (answerIdx) => {
        if (questionAnswered) return; // samo prvi odgovor
        questionAnswered = true;

        clearTimeout(questionTimeout); // zaustavi timeout jer je neko odgovorio

        if (answerIdx === currentQuestion.correct) {
            scores[playerNumber]++;
            io.emit("status-update", `Player ${playerNumber} scored!`);
        } else {
            let other = playerNumber === 1 ? 2 : 1;
            scores[other]++;
            io.emit("status-update", `Player ${playerNumber} answered wrong. Player ${other} scores!`);
        }

        io.emit("score-update", scores);

        // Provera pobednika
        if (scores[1] >= 11) io.emit("status-update", "Player 1 wins!");
        else if (scores[2] >= 11) io.emit("status-update", "Player 2 wins!");
        else setTimeout(sendQuestion, 1000); // sledeće pitanje posle 1s
    });
});

let questionTimeout = null;

function sendQuestion() {
    questionAnswered = false;
    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    io.emit("new-question", currentQuestion);

    // clear prethodni timeout
    if (questionTimeout) clearTimeout(questionTimeout);

    // postavi novi timeout 3s
    questionTimeout = setTimeout(() => {
        if (!questionAnswered) {
            io.emit("status-update", "No one answered in time!");
            // reset timeout pre nego što pozovemo sledeće pitanje
            questionTimeout = null;
            sendQuestion(); // šalje sledeće pitanje
        }
    }, 3000);
}
    // Timeout ako niko ne odgovori u 3 sekunde
    if (questionTimeout) cl
