# 技術スタック（Morning Brief MVP）

## 結論
- フロントエンドは **vite-plus + Tailwind CSS + shadcn/ui** を採用する。
- バックエンド処理は **Node.js(TypeScript)** のバッチを基本とし、低コスト配信のために **GitHub Actions + GitHub Pages** を第一候補とする。
- 将来の拡張先として **AWSサーバーレス（EventBridge/Lambda/S3/CloudFront）** を想定する。

---

## フロントエンド
- **Build Tool / App Foundation**: [`vite-plus`](https://github.com/voidzero-dev/vite-plus)
- **UI Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Language**: TypeScript

### フロントで作るもの
- トップページ（最新朝刊 + 過去記事一覧）
- テーマ別ページ（生成AIなど）
- 記事詳細ページ（Markdownレンダリング）
- `public/index.json` を読んで新着記事を動的反映

---

## バッチ / データ生成
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **主処理**:
  - GoogleアラートRSS収集
  - 重複除去（URL正規化 + 類似判定）
  - 要約生成
  - `content/YYYY-MM-DD/<theme>.md` 出力
  - `public/index.json` 更新

---

## ホスティング / 実行基盤

### Phase 1（推奨）: GitHub Pages
- Nightly cron: GitHub Actions
- 生成物をリポジトリへコミット
- GitHub Pagesで静的配信

### Phase 2（拡張）: AWSサーバーレス
- Scheduler: EventBridge
- Processor: Lambda
- Storage: S3
- CDN/Hosting: CloudFront + S3
- Optional DB: DynamoDB

---

## 採用理由
- **低コスト**: GitHub Pages運用ならほぼ無料。
- **実装速度**: vite-plus + Tailwind + shadcn/ui でUIを高速に構築しやすい。
- **将来拡張性**: AWSサーバーレスに段階移行しやすい。


---

## 実装ステータス
- `apps/web` に vite-plus + Tailwind CSS + shadcn/ui 構成を配置済み。
- 現在は暫定静的ビューア（`index.html`）と並行運用し、次段で `apps/web` を本番表示に切り替える。
