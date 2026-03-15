# AGENTS.md

## Working Conventions
- 開発ツールの導入は `mise` を前提にする。初回は `mise trust mise.toml` の後に `mise install` を実行する。
- Python を使うコマンドは `python` 直実行ではなく `uv run` 経由で実行する。
- 外部フィードや外部ページを確認したら、「設定値」と「実際に取得できた内容」を切り分けて報告する。
- ローカルの絶対パス、認証情報、秘密鍵、個人用トークンは git に含めない。
- `.gitignore` は作業生成物を確実に除外できる状態を保ち、新しい調査用・ビルド用ディレクトリを作ったら必要に応じて更新する。
- 詳細な開発手順は `docs/dev-workflow.md` を参照する。

## Pull Requests
- PR タイトルと本文は日本語で書く。
- Issue タイトルと本文も日本語で書く。
- PR 本文には最低限、`概要`、`変更内容`、`テスト`、`確認したこと`、`関連Issue` を含める。
- PR 作成前には `mise run prepr` を実行し、少なくとも安全性チェックと関連テストが通っていることを確認する。
- 公開リポジトリでは GitHub の secret scanning / push protection の活用も前提にし、ローカルチェックと二重化する。
- 詳細な PR フローは `docs/pr-checklist.md` を参照する。

## Implementation Notes
- RSS だけでなく Atom フィードも考慮して実装・テストする。
- フィードパーサのようなフォーマット依存の処理は、サンプル文字列で再現できるテストを追加する。
- フィード実装の補足は `docs/feed-implementation.md` を参照する。
