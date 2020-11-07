document.querySelector('#user_connect').addEventListener('click', () => {
    let socket = new WebSocket("ws://localhost:8080");

    const resultBody = document.querySelector('body');

    const userName = document.querySelector('#user_name').value;

    const id = 

    socket.onopen = function (e) {
        socket.send(JSON.stringify({name: userName}));
    };

    socket.onmessage = function (event) {
        resultBody.insertAdjacentHTML('beforeend', `<p>${event.data}</p>`);
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            resultBody.insertAdjacentHTML('beforeend', `<p>${event.code}</p>`);
        } else {
            resultBody.insertAdjacentHTML('beforeend', `<p>Соединение разорвано сервером</p>`);
        }
    };

    socket.onerror = function (error) {
        resultBody.insertAdjacentHTML('beforeend', `<p>${error.message}</p>`);
    };

    document.querySelector('#send').addEventListener('click', () => {
        const message = document.querySelector('#message_text').value;
        socket.send(JSON.stringify({
            message,
            userName,
        }));
    });
});

