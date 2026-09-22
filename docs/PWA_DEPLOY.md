# PWA公開メモ

PWA化だけでは遠隔地からアクセスできません。娘さんのスマホから使うには、ビルド済みの `dist/` をHTTPS対応のWebホスティングへ置きます。

## 一番簡単な流れ

1. PCでプロジェクトフォルダを開く
2. `npm install`
3. `npm run build`
4. 生成された `dist/` を静的ホスティングへ公開
5. スマホで公開URLを開く
6. ホーム画面へ追加

## 候補

### Cloudflare Pages / Netlify / Vercel

静的サイトとして `dist/` を公開できます。HTTPSは自動で付くため、PWAとの相性が良いです。

ビルド設定を求められる場合の基本値:

- Build command: `npm run build`
- Output directory: `dist`

### GitHub Pages

GitHubリポジトリにプロジェクトを置き、Actions等で `npm run build` 後の `dist/` をPagesへ公開できます。

v0.4ではViteのアセットURLを相対パスにしているため、リポジトリ配下のURLでも動かしやすい構成です。

## オフライン動作

公開後、スマホで一度正常に読み込むとService Workerが次をキャッシュします。

- アプリ本体
- manifest / icon
- `cards.json`
- `reverse-index.json`
- `purpose-index.json`

その後はネット接続がない状態でも、キャッシュが残っていればカード検索とデッキ構築を利用できます。

## 更新時

Service Workerのキャッシュ名はバージョン付きです。アプリ更新時は `public/sw.js` の `CACHE_VERSION` を更新すると、古いキャッシュを整理しやすくなります。
