# トレンドサーバー MCP プロジェクト

配信のコメント欄にニュースやトレンド情報を自動投稿するMCPサーバー。

## プロジェクト概要

### 目的
- 配信中にニュースやトレンドトピックをNightbotを通じてコメント欄に流す
- 設定したトピックに関連する情報を雑談ネタとして整形し、定期的にコメントする

### 技術スタック
- **言語**: JavaScript
- **MCP**: Model Context Protocol サーバーとして動作
- **LLM**: Claude Code（ヘッドレスモード）でテキスト整形
- **ニュースソース**: Google News RSS
- **投稿先**: Nightbot API

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

### 定期実行機能
- **実行間隔**: 15分ごと
- **実行方法**: Claude Code ヘッドレスモード (`claude --headless`)
- **処理内容**:
  1. 設定されたトレンドトピックを確認
  2. Google News RSSから関連ニュースを取得
  3. Claudeでコメント用に文章を整形（短く、読みやすく）
  4. Nightbotに投稿

---

## 配信連携

### 配信開始検知
OBS側のプラグイン/スクリプトで配信開始を検知し、サーバーに通知する。

**検知時に実行する処理:**
- トレンドサーバーの定期実行を開始
- その他の配信連携ツールの起動（将来的に拡張可能）

### 配信終了検知
- 定期実行を停止
- 連携ツールの終了

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
│   ├── scheduler/
│   │   └── cron.ts        # 定期実行管理
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

### コーディング規約
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

