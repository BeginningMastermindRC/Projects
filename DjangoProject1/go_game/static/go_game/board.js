const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const size = 9;
const cell = canvas.width / size;

let board = Array(size).fill().map(() => Array(size).fill(null));
let currentPlayer = "black";
let previousBoard = null;

let captures = { black: 0, white: 0 };
const komi = 6.5;

// -------------------- UTIL --------------------

function copyBoard(b) {
    return b.map(row => row.slice());
}

function boardsEqual(b1, b2) {
    if (!b1 || !b2) return false;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (b1[y][x] !== b2[y][x]) return false;
        }
    }
    return true;
}

// -------------------- DRAW --------------------

function drawBoard() {
    ctx.fillStyle = "#deb887";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < size; i++) {
        ctx.beginPath();
        ctx.moveTo(cell/2, cell/2 + i * cell);
        ctx.lineTo(canvas.width - cell/2, cell/2 + i * cell);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cell/2 + i * cell, cell/2);
        ctx.lineTo(cell/2 + i * cell, canvas.height - cell/2);
        ctx.stroke();
    }

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (board[y][x]) drawStone(x, y, board[y][x]);
        }
    }
}

function drawStone(x, y, color) {
    ctx.beginPath();
    ctx.arc(cell/2 + x * cell, cell/2 + y * cell, cell/3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
}

// -------------------- GAME LOGIC --------------------

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cell);
    const y = Math.floor((e.clientY - rect.top) / cell);

    if (board[y][x]) return;

    const backupBoard = copyBoard(board);
    const backupCaptures = { ...captures };

    const opponent = currentPlayer === "black" ? "white" : "black";

    // Place stone
    board[y][x] = currentPlayer;

    // Capture opponent
    for (let [nx, ny] of getNeighbors(x, y)) {
        if (board[ny][nx] === opponent) {
            const group = getGroup(nx, ny);
            if (!hasLiberty(group)) {
                removeGroup(group);
            }
        }
    }

    // Suicide check
    const myGroup = getGroup(x, y);
    if (!hasLiberty(myGroup)) {
        board = backupBoard;
        captures = backupCaptures;
        return;
    }

    // Ko check
    if (boardsEqual(board, previousBoard)) {
        board = backupBoard;
        captures = backupCaptures;
        return;
    }

    // Save current state for Ko
    previousBoard = copyBoard(board);

    currentPlayer = opponent;
    drawBoard();
});

// -------------------- HELPERS --------------------

function getNeighbors(x, y) {
    return [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
    ].filter(([nx, ny]) =>
        nx >= 0 && ny >= 0 && nx < size && ny < size
    );
}

function getGroup(x, y, visited = new Set()) {
    const color = board[y][x];
    const key = `${x},${y}`;
    if (visited.has(key)) return [];

    visited.add(key);
    let group = [[x, y]];

    for (let [nx, ny] of getNeighbors(x, y)) {
        if (board[ny][nx] === color) {
            group = group.concat(getGroup(nx, ny, visited));
        }
    }

    return group;
}

function hasLiberty(group) {
    for (let [x, y] of group) {
        for (let [nx, ny] of getNeighbors(x, y)) {
            if (board[ny][nx] === null) return true;
        }
    }
    return false;
}

function removeGroup(group) {
    const color = board[group[0][1]][group[0][0]];
    const opponent = color === "black" ? "white" : "black";

    for (let [x, y] of group) {
        board[y][x] = null;
    }

    captures[opponent] += group.length;
}

// -------------------- SCORING --------------------

function getTerritory() {
    const visited = new Set();
    let blackTerritory = 0;
    let whiteTerritory = 0;

    function floodFill(x, y) {
        let stack = [[x, y]];
        let territory = [];
        let borderingColors = new Set();

        while (stack.length) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;
            if (visited.has(key)) continue;

            visited.add(key);
            territory.push([cx, cy]);

            for (let [nx, ny] of getNeighbors(cx, cy)) {
                if (board[ny][nx] === null) {
                    stack.push([nx, ny]);
                } else {
                    borderingColors.add(board[ny][nx]);
                }
            }
        }

        return { territory, borderingColors };
    }

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (board[y][x] === null && !visited.has(`${x},${y}`)) {
                const { territory, borderingColors } = floodFill(x, y);

                if (borderingColors.size === 1) {
                    const owner = [...borderingColors][0];
                    if (owner === "black") blackTerritory += territory.length;
                    if (owner === "white") whiteTerritory += territory.length;
                }
            }
        }
    }

    return { blackTerritory, whiteTerritory };
}

function calculateScore() {
    const { blackTerritory, whiteTerritory } = getTerritory();

    const blackScore = blackTerritory + captures.black;
    const whiteScore = whiteTerritory + captures.white + komi;

    return { black: blackScore, white: whiteScore };
}

function showScore() {
    const score = calculateScore();

    let result = "Draw";
    if (score.black > score.white) result = "Black wins!";
    else if (score.white > score.black) result = "White wins!";

    alert(
        `Black: ${score.black}\nWhite: ${score.white}\n${result}`
    );
}

// Press Enter to score
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") showScore();
});

// --------------------

drawBoard();