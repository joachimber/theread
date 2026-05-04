import { startTelegramBot } from "./telegram.js";
import { log } from "../lib/log.js";

startTelegramBot().catch((err) => {
  log.fatal({ err: String(err) }, "bot crashed");
  process.exit(1);
});
