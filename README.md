# Splitgram

Instagram のカルーセル投稿・プロフィールグリッド用に、1枚の画像を継ぎ目がズレないように分割するブラウザツール。

**https://splitgram.app**

## 特徴

- 画像の処理はすべてブラウザ内で完結(サーバーにアップロードしない)
- カルーセル(横分割)とグリッド(縦横分割)に対応
- 日本語 / English 切り替え

## 構成

ビルドなしの静的サイト。React と JSX は CDN 経由の Babel Standalone でブラウザ上で変換している。

| ファイル | 内容 |
| --- | --- |
| `index.html` | エントリポイント(ランディング + アプリ) |
| `app.jsx` | アプリ本体・UI・Pro 解除まわり |
| `splitter.jsx` | 分割処理とプレビュー |
| `tweaks-panel.jsx` | 調整パネル |
| `styles.css` | スタイル |
| `index.bundled.html` | 依存を同梱したスタンドアロン版 |

## ローカルで動かす

`app.jsx` などを `fetch` で読み込むので、`file://` ではなくローカルサーバーで開く。

```sh
npx serve .
# または
python3 -m http.server
```

## デプロイ

Netlify に静的ファイルとしてそのまま配置している。

## Pro 版

Pro 機能の解除は Gumroad のライセンスキー検証で行う(`app.jsx` の `GUMROAD` を参照)。

## サンプル画像

起動時は `assets/splitgram-demo.png` を読み込みます。クリーム・ライム・黒の連続したビジュアルで、分割後のつながりを確認できます。読み込みに失敗した場合は従来のCanvasサンプルを表示します。`index.bundled.html` には同じ画像を埋め込んでいます。

通常版のデプロイには `assets/` も含めて配置してください。単体HTML版を使う場合は `index.bundled.html` を `index.html` にリネームして配置できます。
