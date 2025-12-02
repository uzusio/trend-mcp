# GitHub Issueを作成してProjectボードに追加

引数: $ARGUMENTS (Issueのタイトル)

## 手順

1. 以下のコマンドでIssueを作成:
```bash
gh issue create --repo uzusio/trend-mcp --title "$ARGUMENTS" --body "## 概要\n\n（詳細を記入）" --label "enhancement"
```

2. 作成されたIssueのURLを取得

3. GitHub Projectボード(ID: 4)に追加:
```bash
gh project item-add 4 --owner uzusio --url <作成されたissue-url>
```

4. 結果を報告
