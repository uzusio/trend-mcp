import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetchNews, FetchNewsArgs } from "./tools/fetchNews.js";
import { getTrendTopics, setTrendTopics, SetTrendTopicsArgs } from "./tools/topics.js";

// ツール定義
const TOOLS = [
  {
    name: "fetch_news",
    description: "Google News RSSからキーワードでニュースを検索する",
    inputSchema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description: "検索キーワード（トピック）",
        },
        limit: {
          type: "number",
          description: "取得件数（デフォルト: 5）",
          default: 5,
        },
      },
      required: ["keyword"],
    },
  },
  {
    name: "post_to_nightbot",
    description: "Nightbot APIを通じてコメントを投稿する",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "投稿するメッセージ（400文字以内推奨）",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "get_trend_topics",
    description: "現在設定されているトレンドトピックの一覧を取得する",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "set_trend_topics",
    description: "トレンドトピックを編集・設定する",
    inputSchema: {
      type: "object" as const,
      properties: {
        topics: {
          type: "array",
          items: { type: "string" },
          description: "トピックの配列",
        },
      },
      required: ["topics"],
    },
  },
];

// MCPサーバーの作成
const server = new Server(
  {
    name: "trend-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧のハンドラ
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// ツール実行のハンドラ
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "fetch_news": {
      const newsArgs = args as unknown as FetchNewsArgs;
      const news = await fetchNews(newsArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(news, null, 2),
          },
        ],
      };
    }

    case "post_to_nightbot": {
      // TODO: Issue #3 で実装
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ message: "post_to_nightbot is not implemented yet" }),
          },
        ],
      };
    }

    case "get_trend_topics": {
      const topics = await getTrendTopics();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ topics }, null, 2),
          },
        ],
      };
    }

    case "set_trend_topics": {
      const topicsArgs = args as unknown as SetTrendTopicsArgs;
      const updatedTopics = await setTrendTopics(topicsArgs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ topics: updatedTopics }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Trend MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
