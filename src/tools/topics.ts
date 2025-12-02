import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOPICS_FILE = join(__dirname, "../../config/topics.json");

interface TopicsConfig {
  topics: string[];
}

export async function getTrendTopics(): Promise<string[]> {
  const data = await readFile(TOPICS_FILE, "utf-8");
  const config: TopicsConfig = JSON.parse(data);
  return config.topics;
}

export interface SetTrendTopicsArgs {
  topics: string[];
}

export async function setTrendTopics(args: SetTrendTopicsArgs): Promise<string[]> {
  const config: TopicsConfig = { topics: args.topics };
  await writeFile(TOPICS_FILE, JSON.stringify(config, null, 2), "utf-8");
  return args.topics;
}
