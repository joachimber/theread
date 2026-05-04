import { runHeuristicLabelers } from "../indexer/labels.js";
import { log } from "../lib/log.js";

runHeuristicLabelers()
  .then(() => process.exit(0))
  .catch((err) => {
    log.fatal({ err: String(err) }, "labelers crashed");
    process.exit(1);
  });
