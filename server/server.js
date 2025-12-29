const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const fs = require("fs");
const questions = JSON.parse(fs.readFileSync("server/questions.json"));

app.use(express.static("public"));

let playerCount = 0;
let scores = {1:0,2:0};
let currentQuestion = null;
let questionAnswered = false;
let questionTimeout = null;
let showAnswerTimeout = null;

let playerNicknames = {}; // socket.id -> nickname
let playerRecords = {};   // nickname -> {wins, losses}
let readyPlayers = new Set();

io.on("connection", (socket) => {
    playerCount++;
    let playerNumber = playerCount;
    socket.emit("player-number", playerNumber);

    console.log(`Player ${playerNumber} connected`);

    socket.on("disconnect", () => {
        playerCount--;
        readyPlayers.delete(socket.id);
        io.emit("update-ready-status", readyPlayers.size);
        console.log(`Player ${playerNumber} disconnected`);
    });

    socket.on("set-nickname", (name) => {
        playerNicknames[socket.id] = name;
        if (!playerRecords[name]) playerRecords[name] = {wins:0, losses:0};
        socket.emit("update-record", playerRecords[name]);
    });

    socket.on("player-ready", () => {
        readyPlayers.add(socket.id);
        io.emit("update-ready-status", readyPlayers.size);
        if (readyPlayers.size === 2 && !currentQuestion) {
            sendQuestion();
        }
    });

    socket.on("answer", (answerIdx) => {
        if (questionAnswered) return;
        questionAnswered = true;

        clearTimeout(questionTimeout);
        clearTimeout(showAnswerTimeout);

        if (answerIdx === currentQuestion.correct) {
            scores[playerNumber]++;
            io.emit("status-update", `Player ${playerNumber} scored!`);
        } else {
            io.emit("status-update", `Player ${playerNumber} answered wrong.`);
        }

        io.emit("score-update", scores);

        // Provera pobede
        if (scores[1] >= 11 || scores[2] >= 11) {
            let winnerNum = scores[1]>=11 ? 1 : 2;
            let loserNum = winnerNum===1?2:1;

            let winnerSocket = Object.keys(playerNicknames)[winnerNum-1];
            let loserSocket = Object.keys(playerNicknames)[loserNum-1];

            if (winnerSocket) {
                let winnerNick = playerNicknames[winnerSocket];
                playerRecords[winnerNick].wins++;
                io.to(winnerSocket).emit("update-record", playerRecords[winnerNick]);
            }
            if (loserSocket) {
                let loserNick = playerNicknames[loserSocket];
                playerRecords[loserNick].losses++;
                io.to(loserSocket).emit("update-record", playerRecords[loserSocket]);
            }

            io.emit("status-update", `Game Over! Player ${winnerNum} wins!`);
            scores = {1:0,2:0};
            readyPlayers.clear(); // reset ready za sledeću igru
        } else {
            showAnswerTimeout = setTimeout(()=>sendQuestion(),3000);
        }
    });
});

function sendQuestion() {
    questionAnswered=false;
    currentQuestion = questions[Math.floor(Math.random()*questions.length)];
    io.emit("new-question", currentQuestion);

    if (questionTimeout) clearTimeout(questionTimeout);
    if (showAnswerTimeout) clearTimeout(showAnswerTimeout);

    questionTimeout=setTimeout(()=>{
        if(!questionAnswered){
            questionAnswered=true;
            io.emit("status-update", `Time's up! Correct answer: ${currentQuestion.answers[currentQuestion.correct]}`);
            showAnswerTimeout = setTimeout(()=>sendQuestion(),3000);
        }
    },10000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{console.log(`Server running on port ${PORT}`);});
