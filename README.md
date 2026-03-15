# expert-octo-bassoon

## Focus
このリポジトリは、「テーマベースの朝刊（ニュースキュレーション）」MVPの設計と実装に集中します。

- 仕様: `docs/morning-brief-mvp.md`
- 技術スタック: `docs/tech-stack.md`
- 実装計画: `docs/next-steps.md`
- データソース: GoogleアラートRSS
- 初期テーマ: 生成AI（指定RSS 1本から開始）
- 配信候補: GitHub Pages（優先） / AWSサーバーレス（拡張）
- 対象外（後続）: URL単体DeepResearch記事化

## Local Run
1. `mise install`
2. `npm install`
3. `npm run batch`
3. 生成された記事は `content/YYYY-MM-DD/gen-ai.md`、一覧は `public/index.json` を確認
   手動で日付を指定する場合は `BRIEF_DATE=2026-03-15 npm run batch` のように実行

4. `uv run python -m http.server 8000` で起動し、`http://localhost:8000/index.html` でUI確認

## Tooling
- 開発ツールは `mise.toml` で管理します。まず `mise install` を実行してください。
- PR 前の確認は `mise run prepr` を基本にします。
- シークレット検査は `gitleaks` を使います。コミット前は `.githooks/pre-commit` から `scripts/check-safe-commit.sh` が自動実行されます。
- `bash scripts/check-safe-commit.sh` は staged 変更を、`mise run prepr` は追跡ファイル全体を対象に安全性チェックを行います。

## フロントエンド実装
- `apps/web` に **vite-plus + Tailwind CSS + shadcn/ui** 構成を追加しました。
- 開発起動: `npm run dev:web`（依存インストール後）
- 既存の `index.html` / `assets/*` は暫定ビューアとして残しています（段階的に置き換え）。


## GitHub Pages公開について
- 公開物は `npm run prepare:pages` で `docs/` に同期されます。
- Pagesの公開方式は **GitHub Actions** を利用してください（Settings > Pages > Source = GitHub Actions（または Branch: `main` / `/docs`））。
- `.github/workflows/deploy-pages.yml` は、`docs/` に同期した公開用ファイルのみを配信します。

- Branch公開モードの場合、指定できる公開ディレクトリは通常 `/(root)` か `/docs` です。
- 一方で **GitHub Actionsデプロイ**では、workflow内で作る出力ディレクトリ（このリポジトリでは `PAGES_ARTIFACT_DIR`）を任意にできます。
- これにより、リポジトリ全体のソースをそのままPages配信する構成を避けられます。


## 手動実行時の日付上書き
- `workflow_dispatch` 実行時に `brief_date`（YYYY-MM-DD）を指定できます。
- ローカルでは `BRIEF_DATE=2026-03-15 npm run batch` のように指定可能です。
