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

/**
 * トピック一覧からランダムに指定数を選択する
 */
export async function getRandomTopics(count: number = 3): Promise<string[]> {
  const topics = await getTrendTopics();
  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, topics.length));
}

/**
 * トピック配列をOR検索クエリに変換する
 * 例: ["ゲーム", "VTuber", "科学"] -> "ゲーム OR VTuber OR 科学"
 */
export function buildOrQuery(topics: string[]): string {
  return topics.join(" OR ");
}
