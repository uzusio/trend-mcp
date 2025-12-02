import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_DIR = path.join(__dirname, "../../config");

// 投稿履歴のエントリ
export interface PostLogEntry {
  timestamp: string;
  message: string;
  success: boolean;
}

// 投稿履歴データ
interface PostHistory {
  entries: PostLogEntry[];
}

// フィードバック履歴のエントリ
export interface FeedbackEntry {
  timestamp: string;
  rating: "good" | "bad";
  reason?: string;
  newsTitle?: string;
}

// フィードバック統計データ
export interface FeedbackStats {
  good: number;
  bad: number;
  history: FeedbackEntry[];
}

const POST_HISTORY_FILE = path.join(CONFIG_DIR, "post-history.json");
const FEEDBACK_STATS_FILE = path.join(CONFIG_DIR, "feedback-stats.json");

/**
 * 投稿履歴を読み込む
 */
async function loadPostHistory(): Promise<PostHistory> {
  try {
    const data = await fs.readFile(POST_HISTORY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { entries: [] };
  }
}

/**
 * 投稿履歴を保存する
 */
async function savePostHistory(history: PostHistory): Promise<void> {
  await fs.writeFile(POST_HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

/**
 * 投稿をログに記録する
 */
export async function logPost(message: string, success: boolean): Promise<void> {
  const history = await loadPostHistory();
  const entry: PostLogEntry = {
    timestamp: new Date().toISOString(),
    message,
    success,
  };
  history.entries.unshift(entry); // 新しい順

  // 最大100件保持
  if (history.entries.length > 100) {
    history.entries = history.entries.slice(0, 100);
  }

  await savePostHistory(history);
}

/**
 * 投稿履歴を取得する
 */
export async function getPostHistory(limit: number = 10): Promise<PostLogEntry[]> {
  const history = await loadPostHistory();
  return history.entries.slice(0, limit);
}

/**
 * フィードバック統計を読み込む
 */
async function loadFeedbackStats(): Promise<FeedbackStats> {
  try {
    const data = await fs.readFile(FEEDBACK_STATS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { good: 0, bad: 0, history: [] };
  }
}

/**
 * フィードバック統計を保存する
 */
async function saveFeedbackStats(stats: FeedbackStats): Promise<void> {
  await fs.writeFile(FEEDBACK_STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
}

/**
 * フィードバックを記録する
 */
export async function recordFeedback(
  rating: "good" | "bad",
  reason?: string,
  newsTitle?: string
): Promise<FeedbackStats> {
  const stats = await loadFeedbackStats();

  if (rating === "good") {
    stats.good++;
  } else {
    stats.bad++;
  }

  const entry: FeedbackEntry = {
    timestamp: new Date().toISOString(),
    rating,
    reason,
    newsTitle,
  };
  stats.history.unshift(entry);

  // 履歴は最大50件保持
  if (stats.history.length > 50) {
    stats.history = stats.history.slice(0, 50);
  }

  await saveFeedbackStats(stats);
  return stats;
}

/**
 * フィードバック統計を取得する
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  return loadFeedbackStats();
}
