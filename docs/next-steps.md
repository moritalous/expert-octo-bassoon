# 次の進め方（実装開始プラン）

このドキュメントは、Morning Brief MVPを「仕様から実装」へ進めるための最短ステップを定義する。

## ゴール（次の1週間）
- GoogleアラートRSSを1テーマ分取り込み、朝刊記事を1本生成できること。
- 生成物（Markdown + index.json）をGitHub Pagesで表示できること。

## 進捗（現状）
- ✅ `config/themes.json` に初期RSSを設定済み
- ✅ `apps/batch` に最小バッチ実装を追加済み（RSS収集→重複除去→Markdown/index生成）
- ✅ GitHub Actionsの夜間実行ワークフローを実装済み
- ✅ 静的Web UI（一覧 + 本文表示）を追加済み（`index.html`, `assets/*`）
- ✅ vite-plus + Tailwind + shadcn/ui の `apps/web` 雛形を追加済み


## 実装順序（推奨）

### Step 1: プロジェクト骨組みを作る
- `apps/web`: フロントエンド（vite-plus + Tailwind + shadcn/ui）
- `apps/batch`: バッチ処理（Node.js。将来TypeScript化）
- `config/themes.json`: テーマとRSS定義
- `content/`: 生成記事
- `public/index.json`: 記事一覧

**完了条件**
- WebとBatchがそれぞれ `npm run dev` / `npm run batch` で起動できる。

### Step 2: RSS収集を実装する
- `config/themes.json` の `google_alert_rss` を読み込み
- RSSを取得して以下を抽出
  - title
  - link
  - publishedAt
- まずはJSONに保存（`tmp/sources-YYYY-MM-DD.json`）

**完了条件**
- 1テーマにつき5件以上のニュースを取得できる。

### Step 3: 重複除去を実装する
- URL正規化（utm等クエリ除去）
- 同一URLを除去
- タイトル類似度（簡易）で近似重複を除去

**完了条件**
- 明らかな重複リンクが最終出力から消える。

### Step 4: 朝刊記事を生成する
- テンプレートに沿ってMarkdownを生成
- 出典URLを必須化
- `content/YYYY-MM-DD/<theme>.md` に保存
- `public/index.json` を更新

**完了条件**
- 日付 + テーマごとに記事ファイルが生成される。

### Step 5: Web表示を実装する
- `public/index.json` から一覧を表示
- 記事詳細ページでMarkdown表示
- 最新記事をトップに表示

**完了条件**
- ブラウザで最新朝刊を閲覧できる。

### Step 6: 夜間バッチ自動化
- GitHub Actions cronで1日1回実行
- 生成物をコミット
- GitHub Pagesへ反映

**完了条件**
- 手動実行なしで翌日の記事が増える。

---

## すぐ着手するIssue案（3つ）
1. `feat(batch): GoogleアラートRSS収集コマンドを作成`
2. `feat(batch): 朝刊Markdown生成とindex更新を実装`
3. `feat(web): index.jsonから記事一覧/詳細を表示`

---

## リスクと先回り
- **RSSの揺れ**: パース失敗時はスキップしてログを残す。
- **要約品質**: MVPは短文要約固定で開始し、後で改善。
- **重複判定精度**: まずURL一致中心、類似判定は保守的に。

---

## 初期設定（確定）
- Phase 1は **GitHub Pages固定** で進める。
- 生成時間は **毎日 05:00 JST**（GitHub Actions上では前日20:00 UTC）に設定する。
- 初期テーマは **生成AIのみ** とし、RSSは `config/themes.json` の1件を使う。
