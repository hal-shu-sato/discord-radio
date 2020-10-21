Engilsh version is [here](https://github.com/hal-shu-sato/discord-radio/blob/master/README.md).

# discord-radio
Discord上で(いつでも)どこでも誰でも聞けるラジオ

# 必要環境&ライブラリ

- Node.js 12.18.4
- npm 6.14.6 or yarn 1.22.4
- discord.js 12.3.1
  - @discordjs/opus 0.3.2
- ffmpeg-static 4.2.7
- node-cron 2.0.3
- log4js 6.3.0

# 導入

## Yarn

```bash
git clone https://github.com/hal-shu-sato/discord-radio.git
yarn add
```

## NPM

```bash
git clone https://github.com/hal-shu-sato/discord-radio.git
npm install
```

# 使い方

## バッチ (簡単)

Yarnを使用している場合、「start.bat」を起動してください。

## ターミナル (Yarn)

```bash
cd discord-radio
yarn run start
```

## ターミナル (NPM)

```bash
cd discord-radio
npm run start
```

# メモ

MacとLinuxの環境下ではテストをしていません。

このプロジェクトの構想は[こちら](https://gist.github.com/hal-shu-sato/f1b53fe7fe03f3786eaaff629a791e50)

# 開発者

- [ato lash](https://github.com/hal-shu-sato)
- ホームページ: http://halshusato.starfree.jp/
- Twitter: https://twitter.com/hal_shu_sato

# 謝辞

時報の音声ファイルは、[OtoLogic](https://otologic.jp)様のものを使用させていただいております。 ([CC BY 4.0](https://github.com/hal-shu-sato/discord-radio/blob/master/time_signal/LICENSE))

# ライセンス

「Discord Radio for Everyone」のライセンスは、[GPL-3.0 License](https://github.com/hal-shu-sato/discord-radio/blob/master/LICENSE)です。
