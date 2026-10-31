# TeslaSound風アプリ 開発キット（Cursor用）

Instagramで見た TeslaSound（teslasound.io：Teslaのブラウザで開き、GPS速度に
連動してエンジン音を合成再生するWebアプリ）を、自分で作るための準備一式。

## 中身

| ファイル | 内容 |
|---|---|
| `CURSOR_PROMPT.md` | **メイン。** CursorのAgentに最初に貼るプロンプト（仕様全部入り） |
| `CLAUDE_PROMPT.md` | 予備。音作りが難航したとき、Claudeに音響モジュールだけ作らせるプロンプト |
| `cars.json` | 車両6台のデータ（エンジン諸元＋音響パラメータ＋写真パス） |
| `assets/` | 車両写真6枚（ダウンロード済み・読み込み確認済み） |

## 車両ラインナップ（6台）

1. Ferrari 812 Superfast — 6.5L V12 / レッドライン 8,900
2. Lamborghini Huracán EVO — 5.2L V10 / 8,500
3. Dodge Challenger SRT Hellcat — 6.2L スーパーチャージャーV8 / 6,200
4. Porsche 911 GT3 (992) — 4.0L フラット6 / 9,000
5. Ford Mustang GT — 5.0L V8 / 7,500
6. Nissan GT-R (R35) — 3.8L ツインターボV6 / 7,100

気筒数もレッドラインもバラバラなので、音の違いが出しやすい組み合わせにしてある。

## 使い方

1. このフォルダをCursorで開く
2. `CURSOR_PROMPT.md` の区切り線の間を全部コピーして、Agentの最初のメッセージに貼る
3. Cursorが段階的に作る（UI→GPS＋ギアボックス→音→6台切替→仕上げ）
4. 音がうまくいかなければ `CLAUDE_PROMPT.md` をClaudeに貼って
   `engine-audio.js` を作らせ、プロジェクトに差し込む

## 実装の要点（プロンプトに含めてある）

- 速度は車両データではなく **ブラウザのGPS**（`geolocation.watchPosition` の
  `coords.speed`）。本家TeslaSoundと同じ方式。GPS遅延は約0.5〜2秒が前提
- 速度→仮想ギアボックス→回転数→点火周波数（rpm/60 × 気筒数/2）→ Web Audio合成
- 停車中は「長押しREV」で吹かせる（本家と同じ）。PC確認用にデモ走行モード
  （速度スライダー）も仕様に入れてある
- メーターの針は毎フレーム補間で「本物っぽく」動かす指定済み

## 注意

- 位置情報（GPS）は **HTTPS必須**。ローカルで試すときは localhost か、
  デプロイ先（Vercel等）で開くこと
- `assets/` の写真はWebで集めたもので、各画像の出典URLは `cars.json` の
  `imageSourceUrl` に記録してある。**個人で試す分にはよいが、公開・販売する
  なら自分の写真かライセンス済み素材に差し替えること**
- Tesla実機のブラウザでGPSが取れるかは実車確認が必要（本家は動作実績あり）
