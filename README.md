# イジンデン デッキビルダー v0.4

第1〜6弾の576レコードを使う React + TypeScript + Vite デッキビルダーです。

## v0.4 の主な変更

- PWA対応を追加
  - Web App Manifest
  - Service Worker
  - アプリアイコン（仮）
  - オフラインキャッシュ
  - iPhone / Android のホーム画面追加向けメタ情報
- 静的ホスティングを意識して Vite の `base` を相対パス化
- JSON読み込みも `BASE_URL` 対応
- PWA配布後、初回オンライン読み込み後はアプリ本体とカードDBをオフライン利用可能
- iPhone等のセーフエリアを考慮して下部ナビを調整

## データ

- `public/data/cards.json` — CanonicalカードDB
- `public/data/reverse-index.json` — 能力・特性・場所移動のSemantic層
- `public/data/purpose-index.json` — 「やりたいこと」検索用インデックス

## 開発用起動

```bash
npm install
npm run dev
```

同じLAN内のスマホからレスポンシブUIを試す場合:

```bash
npm run dev -- --host
```

※ LAN内HTTPでは、スマホ側のService Worker/PWAインストール機能は通常有効になりません。PWAとしての実機確認はHTTPS公開後に行うのが簡単です。

## 本番ビルド

```bash
npm run build
```

`dist/` が静的公開用の完成物です。

## PWAの使い方

1. `dist/` をHTTPS対応の静的ホスティングへ公開する
2. スマホで公開URLを一度開く
3. Androidならブラウザの「アプリをインストール」等、iPhoneならSafariの共有メニューから「ホーム画面に追加」
4. 初回オンライン読み込み後は、キャッシュ済みのカードDB・検索機能をオフラインでも利用可能

詳しい公開手順は `docs/PWA_DEPLOY.md` を参照してください。

## 注意

- デッキは現在 `localStorage` 保存です。ブラウザ/PWAのサイトデータを削除すると消える可能性があります。
- 将来的にはデッキのJSONエクスポート/インポートを追加するとバックアップできます。
- カード画像を公開する場合は権利条件を別途確認してください。
