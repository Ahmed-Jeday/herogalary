const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const keysDirectory = path.resolve(__dirname, "..", "keys");
const privateKeyPath = path.join(keysDirectory, "private.pem");
const publicKeyPath = path.join(keysDirectory, "public.pem");

fs.mkdirSync(keysDirectory, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicKeyPath, publicKey);

console.log("RSA key pair generated in auth-service/keys");
