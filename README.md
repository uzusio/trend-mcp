# Trend MCP Server

配信のコメント欄にニュースやトレンド情報を自動投稿するMCPサーバー。

## 概要

- Google News RSSからトレンドニュースを取得
- Claude Codeでキャラクター風に文章を整形
- Nightbot APIを通じて配信コメント欄に投稿
- OBS連携で配信開始/終了時に自動でスケジューラを制御

## 必要要件

- Node.js v18+
- Claude Pro/Max サブスクリプション（ヘッドレスモード使用のため）
- Nightbot アカウント + OAuth認証

## セットアップ

### 1. インストール

```bash
git clone https://github.com/uzusio/trend-mcp.git
cd trend-mcp
npm install
npm run build
```

### 2. Nightbot認証

```bash
npm run auth
```

ブラウザが開くので、Nightbotアカウントで認証してください。
トークンは `config/nightbot-token.json` に保存されます。

### 3. トピック設定

`config/topics.json` を編集して、興味のあるトピックを設定：

```json
{
  "topics": [
    "ゲーム",
    "VTuber",
    "テクノロジー",
    "科学"
  ]
}
```

## 使い方

### 手動投稿

Claude Codeで以下のスラッシュコマンドを実行：

```
/post-trend          # ニュースを投稿
/feedback            # 投稿へのフィードバックを記録
/post-and-feedback   # 投稿 → フィードバック を一連で実行
```

### 自動投稿（スケジューラ）

```bash
npm run scheduler:start   # スケジューラ起動（15分間隔で自動投稿）
npm run scheduler:stop    # スケジューラ停止
npm run scheduler:status  # 状態確認
```

### OBS連携

OBS Advanced Scene Switcherを使用して、配信開始/終了時にスケジューラを自動制御できます。

1. Advanced Scene Switcherをインストール
2. 以下のマクロを作成：
   - 配信開始時: `scripts/scheduler-start.bat` を実行
   - 配信終了時: `scripts/scheduler-stop.bat` を実行

## MCPツール一覧

| ツール名 | 説明 |
|---------|------|
| `fetch_news` | Google News RSSからニュースを取得 |
| `post_to_nightbot` | Nightbotにメッセージを投稿 |
| `get_trend_topics` | 設定されたトピック一覧を取得 |
| `set_trend_topics` | トピックを設定 |
| `get_random_topics` | ランダムにトピックを選択 |
| `build_or_query` | トピックをOR検索クエリに変換 |
| `get_makoto_prompt` | キャラクタープロンプトを取得 |
| `fetch_article_content` | 記事本文を取得 |
| `build_format_prompt` | 整形用プロンプトを生成 |
| `fetch_first_valid_article` | 取得可能な記事を探す |
| `record_feedback` | フィードバックを記録 |
| `get_feedback_stats` | フィードバック統計を取得 |
| `get_post_history` | 投稿履歴を取得 |

## ディレクトリ構成

```
trend-mcp/
├── src/
│   ├── index.ts              # MCPサーバー
│   ├── scheduler.ts          # node-cronスケジューラ
│   ├── schedulerCli.ts       # スケジューラCLI
│   ├── auth/                 # Nightbot OAuth
│   ├── tools/                # MCPツール実装
│   └── utils/                # ユーティリティ
├── config/
│   ├── topics.json           # トピック設定
│   ├── preferences.md        # ユーザーの興味傾向
│   ├── post-history.json     # 投稿履歴
│   └── feedback-stats.json   # フィードバック統計
├── scripts/                  # OBS連携用バッチ
└── .claude/commands/         # スラッシュコマンド
```

## フィードバック機能

投稿されたニュースに対してフィードバックを行うと、次回以降の選択精度が向上します。

- `/feedback` でフィードバックを記録
- `config/preferences.md` に興味傾向が蓄積
- `config/feedback-stats.json` に統計が保存

## 制限事項

- Claude Pro/Max サブスクリプションが必要
- Nightbot APIのレート制限に注意
- Google News RSSは非公式のため仕様変更の可能性あり

## ライセンス

MIT
