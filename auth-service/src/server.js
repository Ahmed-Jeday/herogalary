require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => {
  console.log(`Auth Service listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, closing Auth Service`);
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));