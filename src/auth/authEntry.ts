import { startAuthServer } from "./nightbot.js";

startAuthServer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Authentication failed:", err);
    process.exit(1);
  });
