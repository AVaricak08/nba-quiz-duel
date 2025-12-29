const socket = io();

let playerNumber = null;

socket.on("player-number", num => {
    playerNumber = num;
    document.getElementById("player").innerText = `You are Player ${num}`;
});

socket.on("question", q => {
    document.getElementById("question").innerText = q.q;
    const answersDiv = document.getElementById("answers");
    answersDiv.innerHTML = "";

    q.answers.forEach((a, i) => {
        const btn = document.createElement("button");
        btn.innerText = a;
        btn.onclick = () => socket.emit("answer", i);
        answersDiv.appendChild(btn);
    });
});

socket.on("attack", data => {
    document.getElementById("status").innerText =
        `Player ${data.player} scores! 🏀`;
});

socket.on("score-update", score => {
    document.getElementById("score").innerText =
        `${score[1]} : ${score[2]}`;
});

socket.on("winner", player => {
    alert(`🏆 Player ${player} wins!`);
});
