# ニューロサイエンスヨガ（PWA）

ケン・ハラクマ × 宮崎ほくと の共同事業「ニューロサイエンスヨガ」の音声ガイドアプリ。
1つのポーズを **① 入り方（ケン・ハラクマの声）→ ② 改変（宮崎ほくと）→ ③ 狙い（宮崎ほくと）**
の3つの音声で案内する。どれからでも、何度でも聞ける。

- 無料で開いているのは **3ポーズ**（No.1 / No.6 / No.24）
- 解除コードを入れると **23ポーズすべて**が開く

## 🔴 このリポジトリは「生成物」。手で直さない

**正本は `~/dev/neuro-yoga`。** 台本・ポーズの絵・音声はぜんぶ向こうにある。

```
~/dev/neuro-yoga/data/narration.json   台本の本体
~/dev/neuro-yoga/data/poses.json       ポーズの定義
~/dev/neuro-yoga/out_arrow/*.png       矢印つきのポーズの絵
~/dev/neuro-yoga/audio/*.mp3           音声69本
```

直したら、**向こうで組み直してから、ここを作り直す**：

```bash
cd ~/dev/neuro-yoga
python3 build_narration_ai.py     # 台本を直したとき
python3 build_audio.py            # 音声を作り直す
python3 yomi_check_yoga.py --fix  # 読み間違い・言い落としを機械で潰す
python3 build_app.py              # ← このリポジトリの assets/ と data.js を作り直す
```

手で直していいのは **`index.html` / `sw.js` / `manifest.json` / `icons/`** だけ。
`assets/` と `data.js` は `build_app.py` が上書きする。

## 中身

| ファイル | 役割 |
|---|---|
| `index.html` | 画面とロジック（1ファイル完結） |
| `manifest.json` | ホーム画面に追加したときの名前・アイコン |
| `sw.js` | Service Worker。オフラインとキャッシュ |
| `data.js` | **自動生成。** ポーズ・音声の索引。鍵つきのぶんは封じてある |
| `assets/img/*.webp` | ポーズの絵（横900px） |
| `assets/audio/*.mp3` | 音声（64kbps モノラル） |

## 鍵のかけ方（なぜこうしたか）

GitHub Pages は誰でもURLを叩けるので、**画面で隠すだけでは守れない**。

1. 無料の3ポーズだけ素のファイル名（`no01a.mp3` など）
2. 残り20ポーズは `sha256(解除コード + "|" + 名前)` の16桁がファイル名
3. 🔴 **その対応表と台本の本文も、暗号化して `data.js` の中に封じてある**
   （ファイル名を平文で置いたら1と2が丸ごと無駄になる）

解除コードから PBKDF2 で鍵を作り、SHA-256 のカウンタでキーストリームを作って被せている。
ブラウザ側は SubtleCrypto だけで解ける。**サーバーは要らない。**

⚠️ `crypto.subtle` は **https でしか動かない**。手元で確かめるときは `file://` ではなく
ローカルサーバー（`python3 -m http.server`）で開く。GitHub Pages は https なので本番は問題ない。

### 解除コードを変えるとき

`~/dev/neuro-yoga/build_app.py` の `CODE` を書き換えて `python3 build_app.py --force`。
**ファイル名が全部変わる**ので、`sw.js` の `CACHE_NAME` も上げてから push する。

## デプロイ（GitHub Pages）

```bash
git add -A && git status --short && git commit -m "..." && git push
```

🔴 **`sw.js` の `CACHE_NAME` をデプロイのたびに上げる。**
上げないと、すでにホーム画面に追加した端末に古いコードが残り続ける。

## 守っている規格

Notion「🧠 FNT PWA開発ナレッジ」に準拠。とくに効いているもの：

- §2 Network First ＋ `controllerchange` で自動リロード
- §3-1 スクロールさせたい所に `touch-action:auto !important`（子要素にも）
- §3-3 音が使えなくても止まらない（try-catch ＋ 警告バナー）
- §3-5b `html,body` は `height` ではなく **`min-height`**
- 🔴 §3-6 **Audio要素は1つだけ作って使い回す。**
  このアプリは ①→②→③ を自動で繋ぐので、ここを外すと **iOSで2本目から無音**になる
- §7-b アイコンはこのアプリ固有の絵（共通の `FNT512.png` を使い回さない）

---
&copy; 2026 Le grand chariot / Functional Neuro Training
