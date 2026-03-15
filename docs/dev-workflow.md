# 開発ワークフロー

## 初回セットアップ
1. `mise trust mise.toml`
2. `mise install`
3. `npm install`

## 実行ルール
- Python を使うコマンドは `uv run` 経由で実行する。
- 外部サービスの表示差分、RSS の実表示、ログイン有無の切り分けでは、必要に応じて Playwright を使って実態を確認する。
- Playwright で確認した生成物や調査用ファイルは、明示的に必要な場合を除いてコミットしない。

## Playwright 利用時の手順
- `playwright-cli open ...` はブラウザセッションを起動したまま待機するため、別コマンドで `snapshot` や `screenshot` を打つと、親の `npx` プロセスだけ残ることがある。
- 原因は常駐ブラウザそのものではなく、`open` を起点にした CLI 呼び出しが終了確認前にぶら下がることにある。
- 確認作業の最後は必ず `npx --yes --package @playwright/cli playwright-cli list` でセッション有無を確認し、不要なら `npx --yes --package @playwright/cli playwright-cli close-all` を実行する。
- `close-all` はブラウザセッションを閉じるだけで、待機中の `npx` / `playwright-cli` 親プロセスまでは落ちないことがある。最後は `ps` で親プロセスの残存有無まで確認する。
- `--headed` は見た目確認が必要な場合だけ使い、単なる DOM 確認やスクリーンショット取得は headless を優先する。
- ローカル確認の基本手順は次の順で固定する。

1. 必要なら `uv run python -m http.server 8000` などで確認用サーバーを起動する。
2. `npx --yes --package @playwright/cli playwright-cli open <URL>` でセッションを作る。
3. `snapshot`、`console`、`screenshot`、`resize` などは同じ既存セッションに対して実行する。
4. 確認完了後に `playwright-cli list` を実行し、セッションが残っていれば `playwright-cli close-all` を実行する。
5. `ps -ef | grep -E "playwright-cli|@playwright/cli|chromium|chrome"` で残プロセスがないことを確認する。
6. `playwright-cli` の親プロセスが残っていたら `kill <PID>` で明示的に終了する。

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
