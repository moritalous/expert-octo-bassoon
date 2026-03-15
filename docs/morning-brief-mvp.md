# Morning Brief（朝刊）MVP設計

## 目的
「テーマを与えると、関連ニュースを収集・要約し、毎朝ブログ記事として公開する」機能を、**低インフラコスト**で実現する。

---

## 要件（今回の確定方針）

### 技術スタック
- フロントエンド: **vite-plus + Tailwind CSS + shadcn/ui**
- バッチ: Node.js (TypeScript)
- 詳細は `docs/tech-stack.md` を参照

### データソース
- テーマごとの情報源として **GoogleアラートのRSS** を利用する。
- 必要に応じて、手動で追加したRSS（公式ブログや主要メディア）を補助的に併用する。

### 配信・ホスティング
以下のいずれか（または段階的移行）を採用する。

1. **GitHub Pages 構成（最小コスト）**
   - 夜間バッチで記事Markdown/JSONを生成
   - 同一リポジトリへコミットし、静的サイトとして配信
> GitHub Pagesを使う場合は、公開ソースを「GitHub Actions」に設定し、配信対象を公開用ファイルのみに限定する。

- Branchソース公開では `/(root)` または `/docs` が一般的だが、Actions配信ならartifact対象ディレクトリは任意にできる。
2. **AWSサーバーレス構成（拡張性重視）**
   - 夜間バッチ（EventBridge + Lambda/Step Functions）で記事を生成
   - 生成物をS3へ配置
   - WebはS3（+ CloudFront）を参照して新着記事を表示

### 保存方式
- MVPは「**ファイル保存**」を基本とする（JSON/Markdown）。
- 将来的に検索や集計が必要になった場合のみDB（DynamoDB等）を導入する。

---

## スコープ

### 含める
- テーマ登録（例: 生成AI / 半導体 / セキュリティ）
- GoogleアラートRSS収集
- 重複除去（URL正規化 + 類似タイトル）
- 要点要約（出典付き）
- 朝刊記事生成（Markdown + index用JSON）
- 夜間バッチで日次更新
- GitHub Pages または AWSサーバーレスで公開

### 含めない（後続）
- URL単体入力のDeepResearch記事化
- 画像生成
- 多言語展開
- 高度な会員管理/課金

---

## ユーザーストーリー
1. 運営者として、テーマごとにGoogleアラートRSSを登録したい。
2. 毎朝、テーマごとの主要ニュースを短時間で把握したい。
3. 読者に、根拠リンク付きで読みやすい朝刊記事を提供したい。

---

## 成果物イメージ（1記事）
- タイトル: `2026-03-14 生成AI 朝刊`
- リード文（3〜5行）
- トピック一覧（5〜10件）
  - 見出し
  - 3行要約
  - 重要度（High/Medium/Low）
  - 出典URL
- 今日の論点（2〜3点）
- 編集後記（自動生成）

---

## アーキテクチャ案

### A. GitHub Pages（最初に推奨）
- `scheduler`: GitHub Actions（cron）
- `collector`: GoogleアラートRSS取得
- `processor`: 重複除去・要約・記事生成
- `publisher`: `content/` と `public/index.json` を更新してpush
- `hosting`: GitHub Pages

**メリット**
- ほぼ無料
- 運用が簡単
- リポジトリだけで完結

### B. AWSサーバーレス（将来の本命）
- `scheduler`: EventBridge
- `processor`: Lambda（必要ならStep Functions分割）
- `storage`: S3（記事・index・メタデータ）
- `hosting`: CloudFront + S3（静的Web）
- `optional`: DynamoDB（テーマや実行ログ）

**メリット**
- スケールしやすい
- S3を中心に記事配信の柔軟性が高い

---

## データモデル（MVP最小）

### `config/themes.json`
```json
[
  {
    "id": "gen-ai",
    "name": "生成AI",
    "google_alert_rss": [
      "https://www.google.com/alerts/feeds/09189487958967512194/3427033226118211136"
    ],
    "supplemental_rss": [],
    "is_active": true
  }
]
```

- `google_alert_rss`: 本番朝刊の主ソース。Google Alerts を常時収集する。
- `supplemental_rss`: 本番に含める補助ソース。採用するものだけ明示追加する。
- 試験用フィードは設定に残しても本番収集対象へ混ぜない。

### `content/YYYY-MM-DD/<theme>.md`
- 生成済み朝刊記事（本文）

### `public/index.json`
- 日付・テーマ・タイトル・URLの一覧
- Web側はこのindexを読むことで「新着が増えた」ように表示できる

---

## バッチ処理フロー（日次）
1. 有効テーマを取得
2. テーマごとにGoogleアラートRSSを収集
   補助ソースを使う場合も、明示追加された `supplemental_rss` のみを収集対象にする
3. URL正規化と類似判定で重複除去
4. 記事ごとに要点抽出（出典保持）
5. 朝刊テンプレートへ整形
6. `content/` にMarkdown保存
7. `public/index.json` を更新
8. GitHub Pages更新 or S3配置

---

## 品質ルール
- すべての要約に出典URLを残す
- 同一ドメイン偏重を避ける（最大比率を設定）
- 事実と推論を分離
- 確度が低い情報は「未検証」と注記
- Googleアラート由来でない補助ソースを使った場合は明記

---

## 受け入れ条件（Definition of Done）
- テーマ1件で朝刊記事1本を夜間バッチで自動生成できる
- 記事内に最低5件の出典リンクがある
- 同一URL重複が除去される
- `public/index.json` から新着記事が参照できる
- GitHub Pages もしくは AWSサーバーレスのどちらか一方で公開できる

---

## 実装タスク（優先順）
1. `config/themes.json` を作成（GoogleアラートRSS登録）
2. RSS収集モジュール実装
3. 重複除去ロジック実装
4. 朝刊Markdown生成
5. `public/index.json` 自動更新
6. GitHub Actions cron で毎日 05:00 JST 実行（UTC 20:00）
7. （オプション）AWS版デプロイ手順を追加

---

## 推奨ロードマップ
- **Phase 1（今週）**: GitHub Pagesでまず公開（最小コスト）
- **Phase 2**: S3/CloudFront構成へ移行し、記事数増加に対応
- **Phase 3**: DynamoDB導入、検索・ランキング・品質評価を追加
