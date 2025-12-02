import { getValidAccessToken } from "../auth/nightbot.js";
import { logPost } from "../utils/logger.js";

export interface PostToNightbotArgs {
  message: string;
}

export interface NightbotResult {
  success: boolean;
  message: string;
}

export async function postToNightbot(args: PostToNightbotArgs): Promise<NightbotResult> {
  const { message } = args;

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get access token",
    };
  }

  if (message.length > 400) {
    return {
      success: false,
      message: "Message exceeds 400 characters limit",
    };
  }

  try {
    const response = await fetch("https://api.nightbot.tv/1/channel/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ message }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Nightbot API error: ${response.status} - ${error}`,
      };
    }

    // 投稿成功をログに記録
    await logPost(message, true);

    return {
      success: true,
      message: "Message posted successfully",
    };
  } catch (error) {
    // 投稿失敗もログに記録
    await logPost(message, false);

    return {
      success: false,
      message: `Failed to post message: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
