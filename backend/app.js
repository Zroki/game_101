const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const WebSocket = require('ws');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Логика вебсокета
const wss = new WebSocket.Server({ port: 8080 });
const users = [];
wss.on('connection', (webSocked, req) => {
    webSocked.on('message', (message) => {
        const objMessage = JSON.parse(message);
        if (objMessage.name) {
            users.push({
                user: objMessage.name,
                webSocked,
            });
            const connectedUsers = users.filter(user => user.user !== objMessage.name);
            if (connectedUsers > 0) {
                connectedUsers.forEach(user => {
                    user.webSocked.send(`${objMessage.name} подключился`);
                })
            }
        } else {
            users.forEach(user => {
                user.webSocked.send(`${objMessage.userName}::${objMessage.message}`);
            })
        }
    });
});

module.exports = app;
