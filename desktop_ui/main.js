let isServerRunning = false;
let logs = [];
let ws;

const powerBtn = document.getElementById('power-btn');
const pulseRing = document.getElementById('pulse-ring');
const ipDisplay = document.getElementById('ip-display');
const consoleArea = document.getElementById('console');

// Conectar con Python Admin WebSockets
function connectWebSocket() {
    ws = new WebSocket("ws://" + window.location.hostname + ":5006");
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case "ip":
                ipDisplay.innerText = `IP: ${data.val}:5005`;
                break;
            case "state":
                update_state(data.val);
                break;
            case "log":
                add_log(data.val);
                break;
            case "player":
                update_player(data.id, data.status);
                break;
        }
    };
    
    ws.onclose = () => {
        add_log("Error: Conexión con el servidor interno perdida. Reconectando...");
        setTimeout(connectWebSocket, 2000);
    };
}

powerBtn.addEventListener('click', () => {
    if(ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({cmd: "toggle"}));
    }
});

function update_state(state) {
    if (state === "running") {
        isServerRunning = true;
        powerBtn.classList.remove('offline');
        powerBtn.classList.add('online');
        pulseRing.classList.add('active');
    } else {
        isServerRunning = false;
        powerBtn.classList.remove('online');
        powerBtn.classList.add('offline');
        pulseRing.classList.remove('active');
        for(let i=1; i<=4; i++) {
            update_player(i, 'offline');
        }
    }
}

function update_player(pid, state) {
    const slot = document.getElementById(`slot-${pid}`);
    if(!slot) return;
    
    if (state === 'online') {
        slot.classList.add('online');
        slot.querySelector('.player-status').innerText = 'ONLINE';
    } else {
        slot.classList.remove('online');
        slot.querySelector('.player-status').innerText = 'OFFLINE';
    }
}

function add_log(msg) {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const logLine = `[${timeString}] ${msg}`;
    
    logs.push(logLine);
    if(logs.length > 50) logs.shift();
    
    consoleArea.value = logs.join('\n');
    consoleArea.scrollTop = consoleArea.scrollHeight;
}

// Iniciar
window.onload = connectWebSocket;
