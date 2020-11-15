const io = require("socket.io")({ path: "/api" });

const rooms = io.of("/").adapter.rooms;
rooms.set("gameRoom", new Set());

let users = [];
let userTurn = 0;

io.on("connection", async client => {

  // Для сообщений только этому сокету
  const pm = io.to(client.id);

  client.on("login", name => {
    if (!name) {
      io.to(client.id).emit("login", false);
      return;
    }
    if ("name" in client) {
      io.to(client.id).emit("login", false);
      return;
    }
    client.name = name;
    client.join("gameRoom");
    console.log(`${client.name} logged in.`);
    pm.emit("login", true);
    users.push({ id: client.id, name: client.name});
    io.to("gameRoom").emit("updateLobby", users);
  });

  client.on("message", message => {
    checkRoom((message) => {
      io.to("gameRoom").send(`${client.name}: ${message}`);
    }, message);
  });

  client.on("turn", data => {
    io.to("gameRoom").emit("turn", {
      id: users[userTurn].id,
      card: data,
      username: client.name
    });
    userTurn += 1;
    if (userTurn === users.length) {
      userTurn = 0;
    }
  });

  client.on("start", () => {
    io.to("gameRoom").emit("turn", {
      firstTurn: true,
      id: users[userTurn].id
    });
    userTurn += 1;
    if (userTurn === users.length) {
      userTurn = 0;
    }
  })

  client.on("disconnect", () => {
    users = users.filter( user => user.id !== client.id);
    io.to("gameRoom").emit("updateLobby", users);
  })

  function checkRoom(cb, arg) {
    if (rooms.get("gameRoom").has(client.id)) {
      cb(arg);
    }
    else {
      pm.emit("login", false);
    }
  }

});



module.exports = io;