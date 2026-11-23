const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/db");
const { createSocketServer } = require("./sockets");

async function start() {
  await connectDatabase();

  const server = http.createServer(app);
  const io = createSocketServer(server);

  // Permet aux contrôleurs REST d'émettre des événements Socket.IO.
  app.set("io", io);

  server.listen(env.port, () => {
    console.log(`Chat Service listening on http://localhost:${env.port}`);
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`${signal} received, closing Chat Service`);

    io.close();

    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start Chat Service:", error);
  process.exit(1);
});
