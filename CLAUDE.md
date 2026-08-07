# gogo-quick-overlay

Overwatchの参加型企画用、配信オーバーレイ（リーダーボード）。ビルドステップ・npm依存のない静的サイトで、状態はFirebase Realtime Databaseで管理し、control.html（操作）とdisplay.html（表示）をインターネット越しにリアルタイム同期する。

公開URL: https://gogomac.netlify.app
GitHub: https://github.com/yuhiko1122/-gogo-quick-overlay

## ファイル構成

- `index.html` — トップページ（display/controlへのリンクのみ）
- `display.html` — OBSのブラウザソースに登録する表示用ページ（リーダーボード＋ボーナス/ペナルティ演出）
- `control.html` — ポイント操作パネル。スマホ等、配信には映さない別デバイスのブラウザから開く。初回のみパスコード入力が必要
- `firebase-config.js` — Firebase初期化・config値を1箇所に集約し、control.html/display.htmlから`import`される共有モジュール
- `README.md` — 使い方・Firebaseセットアップ手順の説明

サーバーサイドコード・ビルドステップなし（Firebase SDKはCDN経由のESM importで読み込む）。

## 仕組み

- Firebase Realtime Databaseのパスは2つのみ:
  - `/users/<pushId>`: `{name, points}` — `push()`が生成するランダムIDをキーにする（名前をキーにするとRTDBの禁止文字`. # $ [ ]`に抵触するため）
  - `/event`: `{type: 'bonus'|'penalty', name, ts}` — ボーナス/ペナルティ発生をdisplay側に伝える一回きりのイベント
- `control.html`・`display.html`とも`onValue()`でリアルタイム購読する。**`onValue`はリスナー登録時に現在値で即発火する**ため、`display.html`の`event`購読は初回発火を`eventReady`フラグでスキップし、起動時に過去のイベントで誤発火しないようにしている。この初回スキップのロジックは削除しないこと。
- ポイント更新（`addPoint`）は`runTransaction`でフィールド単位に行う。複数端末から同時操作されても、単純な「読んで丸ごと書き戻す」方式だと後勝ちで他人の操作を消してしまうため。
- Firebase Anonymous Authenticationを使用し、RTDBルールは`auth != null`を要求する（Firebaseコンソール側で匿名認証を有効化しておく必要がある）。ユーザーには一切見えない自動サインインで、control.htmlの人間向けパスコードとは別レイヤーの保護。
- `control.html`のパスコードはUIレベルの簡易ゲート（`CONTROL_PASSCODE`定数と照合、`localStorage`に解除済みフラグを保存）。リポジトリがpublicなため秘匿性はなく、実効的なDB保護はAnonymous Auth側が担う。
- ポイントが±10に達すると自動でボーナス/ペナルティ演出が発火し、そのユーザーのポイントのみ0にリセットされる。
- 参加者は最大5人まで（`control.html` の `MAX_USERS` 定数）。RTDBのセキュリティルール言語には子要素数を数える`numChildren()`相当のメソッドが存在しないため、この上限はクライアント側チェックのみで担保しており、DBルール側では強制していない。
- OBSのブラウザソース内では `window.confirm()` が機能しないため、削除・リセット系ボタンは「もう一度押すと確定」の2クリック方式（`armConfirm` 関数）で実装している。標準の `confirm()` に戻さないこと。

## ルール文言のカスタマイズ

他配信者がこの企画を流用する場合、書き換えるのは以下のみ（ロジックは変更不要）:
- `control.html` — 参加者向けルール表示（`+1ルール`/`-1ルール`の `<ul>`、`bonus-line` の文言）
- `display.html` — `EFFECT_TEXT` オブジェクト（ボーナス/ペナルティ達成時の演出文言）

デフォルトルールの詳細は `README.md` を参照。

## 配色

Overwatch風の配色をCSS変数で統一している（3ファイルとも同じ値を重複定義）:
```
--ow-orange: #F99E1A
--ow-dark:   #10151F
--ow-dark2:  #1B2432
--ow-white:  #F4F4F4
--ow-red:    #E0442E (display.htmlのみ)
--ow-green:  #7CD87C (display.htmlのみ)
```
配色を変える場合は3ファイルとも揃えて修正する。

## デプロイ

Netlifyにホスティング（静的サイトとしてそのまま配信、ビルドコマンドなし）。`main` ブランチへのpushが本番URLに反映される想定のため、変更をpushする際はその点を意識する。Firebase側の設定（Realtime Databaseのセキュリティルール、匿名認証の有効化）はgit管理外で、Firebaseコンソールでの手動操作が必要。

## 作業ルール

- `git push` する前に、ユーザー視点での変更内容（何がどう変わるか）を簡潔に伝えてから実行すること。コミットメッセージの読み上げではなく、配信で使う人が理解できる言葉で。

## 既知の制約

- `control.html`のパスコードはUIレベルの簡易ゲートに過ぎず、リポジトリがpublicなため実質的に非公開情報ではない。DB保護はFirebase Anonymous Auth＋ルールで別途担保している。
- 複数端末からほぼ同時に同名の新規ユーザーを作成すると、稀に重複登録されうる（低頻度想定のため未対策）。
- 参加者上限（5人）はクライアント側チェックのみ。DBルールを直接叩けば上限を超えて書き込むことは技術的には可能（Anonymous Auth必須ではあるので、野良スクリプト・スキャナー程度は防げる）。
- `<script type="module">`を使うため、`file://`で直接HTMLをダブルクリック起動するとESM importがCORSでブロックされる。ローカル確認には`npx serve .`等の簡易HTTPサーバーが必要。
- サーバーがないため、ポイント履歴のバックアップ・監査ログはない。
