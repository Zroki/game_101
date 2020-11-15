import io from 'socket.io';
import {players, lastTurn, turns} from "../store";
import { get } from 'svelte/store';

class SocketClient {
    socket = null;

    constructor() {
        // Создаём активное подключение к сокету на сервере
        this.socket = io({path: "/api"});

        // Обрабатываем событие login
        this.socket.on("login", (data) => {
            this.onlogin(data);
        });

        this.socket.on('turn', (turn) => {
            turns.set([...get(turns), turn]);
            lastTurn.set(turn);
        });
        this.socket.on("updateLobby", this.updateLobby);
        this.socket.on("message", this.incommingMessage);
    }

    updateLobby(users) {
        // Обновляем в реальном времени состояние подключенных пользователей
        players.set(users);
    }

    login(name) {
        this.socket.emit("login", name);
    }

    // Первое подключение
    onlogin(data) {
        if (data) {
            this.socket.send("Hi all!");
        } else {
            console.log("Bad login");
        }
    }

    incommingMessage(message) {
        console.log(message);
    }

    sendMessage(text) {
        this.socket.send(text);
    }

    startGame() {
        this.socket.emit('start');
    }

    turn(card) {
        this.socket.emit('turn', card);
    }
}

const socketClient = new SocketClient();

export default socketClient;