export default class SocketClient {
    static socket = null;
    static userName = null;
    static id = null;

    static generateId() {
        return (Math.random() * 1000000).toFixed(0);
    }

    static connect(url, userName) {
        SocketClient.socket = new WebSocket(`ws://${url}`);
        SocketClient.userName = userName;
        SocketClient.id = SocketClient.generateId();

        SocketClient.socket.onopen = () => {
            SocketClient.send({
                id: SocketClient.id,
                name: SocketClient.userName,
                event: 'connect'
            });
        };

        SocketClient.socket.onmessage = (event) => {
            SocketClient.drawMessage(event.data);
        };

        SocketClient.socket.onclose = (event) => {
            if (event.wasClean) {
                SocketClient.send({
                    id: SocketClient.id,
                    name: SocketClient.userName,
                    event: 'leave'
                });
            } else {
                SocketClient.drawMessage('Соединение разорвано сервером');
            }
        };

        SocketClient.socket.onerror = (error) => {
            if (SocketClient.readyState === 3) {
                SocketClient.drawMessage('Ошибка соединения с сервером');
            }
            console.error(error);
        };
    }

    static send(data) {
        SocketClient.socket.send(JSON.stringify(data));
    }

    static drawMessage(message) {
        // TODO Сделать отрисовывание сообщения от сервера
    }
}