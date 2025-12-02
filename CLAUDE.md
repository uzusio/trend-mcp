# トレンドサーバー MCP プロジェクト

配信のコメント欄にニュースやトレンド情報を自動投稿するMCPサーバー。

## プロジェクト概要

### 目的
- 配信中にニュースやトレンドトピックをNightbotを通じてコメント欄に流す
- 設定したトピックに関連する情報を雑談ネタとして整形し、定期的にコメントする

### 技術スタック
- **言語**: TypeScript
- **ランタイム**: Node.js (v18+)
- **MCP SDK**: @modelcontextprotocol/sdk（stdio通信）
- **スケジューラ**: node-cron（サーバー内蔵、15分間隔）
- **LLM**: Claude Code（ヘッドレスモード）でテキスト整形
- **RSSパーサー**: rss-parser
- **HTTPクライアント**: node-fetch
- **ニュースソース**: Google News RSS
- **投稿先**: Nightbot API

### アーキテクチャ
```
┌─────────────────────────────┐
│  MCPサーバー (stdio)         │
│  ├─ MCP Tools               │
│  └─ node-cron               │
│      └─ claude --headless   │
└─────────────────────────────┘
```

---

## MCPツール一覧

### 1. `fetch_news`
Google News RSSからニュースを取得する。

**パラメータ:**
- `category`: カテゴリ（`national` | `world` | `business` | `tech` | `entertainment` | `sports`）
- `keyword`: 検索キーワード（オプション）
- `limit`: 取得件数（デフォルト: 5）

**戻り値:**
- ニュース記事の配列（タイトル、URL、公開日時）

### 2. `post_to_nightbot`
Nightbot APIを通じてコメントを投稿する。

**パラメータ:**
- `message`: 投稿するメッセージ（400文字以内推奨）

**戻り値:**
- 投稿成功/失敗のステータス

### 3. `get_trend_topics`
現在設定されているトレンドトピックの一覧を取得する。

**パラメータ:** なし

**戻り値:**
- トピック一覧

### 4. `set_trend_topics`
トレンドトピックを編集・設定する。

**パラメータ:**
- `topics`: トピックの配列

**戻り値:**
- 更新後のトピック一覧

---

## サーバー機能

### MCPサーバー
- stdio通信でClaude Desktopや他のMCPクライアントと接続
- ツールの提供とリソース管理

### 定期実行機能（node-cron）
- **実行間隔**: 15分ごと（`*/15 * * * *`）
- **実行方法**: サーバープロセス内でnode-cronがClaude Code ヘッドレスモードを起動
- **処理内容**:
  1. 設定されたトレンドトピックを確認
  2. Google News RSSから関連ニュースを取得
  3. Claudeでコメント用に文章を整形（短く、読みやすく）
  4. Nightbotに投稿

```bash
# ヘッドレス実行コマンド（スラッシュコマンド使用）
claude -p "/post-trend" --mcp-config .mcp.json --permission-mode bypassPermissions
```

```typescript
// スケジューラ実装イメージ
import cron from 'node-cron';
import { exec } from 'child_process';

cron.schedule('*/15 * * * *', async () => {
  exec('claude -p "/post-trend" --mcp-config .mcp.json --permission-mode bypassPermissions');
});
```

---

## 配信連携

### スケジューラCLI

スケジューラの手動制御：
```bash
npm run scheduler:start   # スケジューラをバックグラウンド起動
npm run scheduler:stop    # スケジューラを停止
npm run scheduler:status  # 実行状態を確認
```

### OBS連携（Advanced Scene Switcher）

OBSプラグイン「Advanced Scene Switcher」を使って、配信開始/終了時に自動でスケジューラを制御する。

#### インストール
1. OBS → ツール → プラグインマネージャー から「Advanced Scene Switcher」をインストール
2. または公式サイトからダウンロード: https://obsproject.com/forum/resources/advanced-scene-switcher.395/

#### 設定手順
1. OBS → ツール → Advanced Scene Switcher を開く
2. 「Macro」タブを選択
3. 以下の2つのマクロを作成:

**マクロ1: 配信開始時**
```
名前: Start Trend Scheduler
条件: Streaming → Started
アクション: Run → Path: c:\work\trend-mcp\scripts\scheduler-start.bat
```

**マクロ2: 配信終了時**
```
名前: Stop Trend Scheduler
条件: Streaming → Stopped
アクション: Run → Path: c:\work\trend-mcp\scripts\scheduler-stop.bat
```

#### 動作確認
1. OBSで配信を開始 → スケジューラが自動起動
2. `npm run scheduler:status` で確認
3. 配信を終了 → スケジューラが自動停止

---

## ディレクトリ構成

```
trend-server/
├── src/
│   ├── index.ts           # MCPサーバーエントリポイント
│   ├── tools/
│   │   ├── fetchNews.ts   # Google News RSS取得
│   │   ├── nightbot.ts    # Nightbot投稿
│   │   └── topics.ts      # トピック管理
│   ├── scheduler.ts       # node-cron 定期実行
│   └── utils/
│       └── rss.ts         # RSSパーサー
├── config/
│   ├── topics.json        # トレンドトピック設定
│   └── settings.json      # サーバー設定
├── CLAUDE.md
├── package.json
└── tsconfig.json
```

---

## 設定ファイル

### `config/topics.json`
```json
{
  "topics": [
    "ゲーム",
    "VTuber",
    "テクノロジー"
  ]
}
```

### `config/settings.json`
```json
{
  "intervalMinutes": 15,
  "nightbot": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "accessToken": "YOUR_ACCESS_TOKEN"
  },
  "messageTemplate": "【ニュース】{title} - {source}"
}
```

---

## 環境変数

```
NIGHTBOT_CLIENT_ID=xxx
NIGHTBOT_CLIENT_SECRET=xxx
NIGHTBOT_ACCESS_TOKEN=xxx
```

---

## 開発ガイドライン

### コード品質と職務意識

#### 基本原則
- 標準ツールを使って、高品質で汎用的な解決策を実装すること
- ヘルパースクリプトや回避策を作成しないこと
- すべての有効な入力に対して正しく動作する解決策を書くこと

#### テストに対する姿勢
- テストは正しさを**検証**するためのものであり、解決策を**定義**するものではない
- 値をハードコードしたり、特定のテスト入力だけに対応する実装をしないこと
- 問題の本質を理解し、正しいアルゴリズムを実装することに集中すること

#### 判断と報告の義務
- タスクが不合理または実行不可能な場合は、回避策を講じずに報告すること
- テスト自体が間違っていると判断した場合も、そのまま通すのではなく指摘すること
- 解決策は堅牢で、保守可能で、拡張可能であるべき

### コード探索ルール
- コード編集を提案する前に、必ず関連ファイルを読んで理解すること
- 見ていないコードについて推測しないこと
- ユーザーが特定のファイル/パスを参照した場合、説明や修正を提案する前に必ず開いて確認すること

### コーディング規約
- TypeScript strict mode 使用
- ESLint + Prettier でフォーマット
- エラーハンドリングは明示的に行う

### テスト
- 各ツールのユニットテストを作成
- Nightbot APIはモックを使用

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
refactor: リファクタリング
```

---

## 制限事項・注意点

### サブスクリプション依存
- Claude Code ヘッドレスモードを使用するため、Claude Pro/Max サブスクリプションが必要
- **一般公開は可能だが、一般利用は現実的ではない**

### API制限
- Nightbot API のレート制限に注意
- Google News RSS は公式APIではないため、仕様変更の可能性あり

