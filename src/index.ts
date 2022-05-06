import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });

server.on("connection", (socket) => {
  socket.on("open", () => {
    /* Starts sending game states on open */
    socket.send(JSON.stringify(""));
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  socket.on("message", (data) => {
    /* Handles input and sends updated game state */
    socket.send(JSON.stringify(""));
  });
});
