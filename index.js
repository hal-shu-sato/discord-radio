require("dotenv").config();
const log4js = require("log4js");
const cron = require("node-cron");
const Discord = require("discord.js");
const radio = require("./commands/radio");
const schedule = require("./commands/schedule");
const help = require("./commands/help");

const logger = log4js.getLogger();
logger.level = "debug";
const client = new Discord.Client();
const prefix = process.env.PREFIX;
const ownerId = process.env.OWNER_ID;
const broadcast = client.voice.createBroadcast();

// 登録・解除通知
broadcast.on("subscribe", () => {
  logger.info("New broadcast subscriber!");
});
broadcast.on("unsubscribe", () => {
  logger.info("Channel unsubscribed from broadcast :(");
});

client.on("ready", () => {
  client.user.setPresence({ activity: { name: "OFF AIR..." } });
  logger.info(`Logged in as ${client.user.tag}!`);
  schedule.set(client, broadcast);
  // 日付変更時スケジュール再設定
  cron.schedule(
    "0 0 * * *",
    () => {
      schedule.set(client, broadcast);
    },
    { timezone: "Asia/Tokyo" }
  );
});

client.on("message", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    message.reply("pong");
    logger.info(`Pinged from ${message.channel.name} in ${message.guild}.`);
  } else if (command === "help" || command === "?") {
    help.send(message);
  }

  if (!message.guild) return;

  if (command === "play" || command === "p") {
    radio.play(message, broadcast);
  } else if (command === "stop" || command === "s") {
    radio.stop(message);
  } else if (command === "nowplaying" || command === "np") {
    schedule.nowPlaying(message.channel);
  }

  if (message.author.id != ownerId) return;

  if (command === "schedule") {
    if (args[0] === "reload") {
      schedule.reload(message, client, broadcast);
    } else if (args[0] === "list") {
      schedule.list(message);
    }
  }
});

client.login();
