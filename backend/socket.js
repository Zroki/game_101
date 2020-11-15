const io = require("socket.io")({ path: "/api" });

const rooms = io.of("/").adapter.rooms;
rooms.set("gameRoom", new Set());

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
  });

  client.on("message", message => {
    checkRoom((message) => {
      io.to("gameRoom").send(`${client.name}: ${message}`);
    }, message);
  });

  client.on("turn", data => {
    checkRoom((data) => {
      io.to("gameRoom").send(`${client.name}: Make turn! He draw ${data}!`);
    }, data);
  });

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