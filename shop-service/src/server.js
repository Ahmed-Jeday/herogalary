require("dotenv").config();

const app = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/database");

const port = Number(process.env.PORT || 3003);

async function start() {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`Shop Service listening on http://localhost:${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received, closing Shop Service`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Unable to start Shop Service", error);
  process.exit(1);
});
