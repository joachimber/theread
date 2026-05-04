import { runDetectorLoop } from "./runner.js";
import { log } from "../lib/log.js";

runDetectorLoop().catch((err) => {
  log.fatal({ err: String(err) }, "detector crashed");
  process.exit(1);
});
