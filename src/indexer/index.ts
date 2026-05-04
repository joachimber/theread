import { runIndexer } from "./runner.js";
import { log } from "../lib/log.js";

runIndexer().catch((err) => {
  log.fatal({ err: String(err) }, "indexer crashed");
  process.exit(1);
});
