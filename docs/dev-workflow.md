# 開発ワークフロー

## 初回セットアップ
1. `mise trust mise.toml`
2. `mise install`
3. `npm install`

## 実行ルール
- Python を使うコマンドは `uv run` 経由で実行する。
- 外部サービスの表示差分、RSS の実表示、ログイン有無の切り分けでは、必要に応じて Playwright を使って実態を確認する。
- Playwright で確認した生成物や調査用ファイルは、明示的に必要な場合を除いてコミットしない。

## 外部確認の報告
- 外部フィードや外部ページを確認したら、「設定値」と「実際に取得できた内容」を分けて報告する。
- 生成物を再生成して確認した場合も、設定上どうなる想定かと、実際の出力結果を分けて記載する。

## 安全性チェック
- シークレット検査は `gitleaks` を使う。
- 安全性チェックの実体は `scripts/check-safe-commit.sh` とする。
- `bash scripts/check-safe-commit.sh` は staged 変更を対象に実行する。
- `mise run prepr` は追跡ファイル全体の安全性チェックと関連テストをまとめて実行する。

## worktree 運用
- worktree で作業を始めたら、まず `codex/` 接頭辞の作業ブランチを作る。
- 別 worktree で `main` を使用中の場合、この worktree で `main` への checkout が失敗することがある。
- PR マージ後にローカル `main` へ戻せなくても、GitHub 上でマージ済みなら優先度は低い。必要なら別 worktree 側で `main` を更新する。
