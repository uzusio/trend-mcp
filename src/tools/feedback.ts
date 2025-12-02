import {
  recordFeedback as logRecordFeedback,
  getFeedbackStats as logGetFeedbackStats,
  getPostHistory as logGetPostHistory,
  FeedbackStats,
  PostLogEntry,
} from "../utils/logger.js";

export interface RecordFeedbackArgs {
  rating: "good" | "bad";
  reason?: string;
  newsTitle?: string;
}

export interface RecordFeedbackResult {
  success: boolean;
  stats: FeedbackStats;
}

/**
 * フィードバックを記録する
 */
export async function recordFeedback(args: RecordFeedbackArgs): Promise<RecordFeedbackResult> {
  const { rating, reason, newsTitle } = args;
  const stats = await logRecordFeedback(rating, reason, newsTitle);
  return {
    success: true,
    stats,
  };
}

/**
 * フィードバック統計を取得する
 */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  return logGetFeedbackStats();
}

/**
 * 投稿履歴を取得する
 */
export async function getPostHistory(limit: number = 10): Promise<PostLogEntry[]> {
  return logGetPostHistory(limit);
}
