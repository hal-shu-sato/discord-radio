const fs = require("fs");
const log4js = require("log4js");
const cron = require("node-cron");
// eslint-disable-next-line no-unused-vars
const { Client, VoiceBroadcast, Message, MessageEmbed, TextChannel } = require("discord.js");
const { getJoinList } = require("./radio");

const logger = log4js.getLogger();
logger.level = "debug";

/**
 * @typedef {"RECORD" | "LIVE" | "TIME_SIGNAL" | "OFF_AIR"} ProgramType
 */
/**
 * 番組情報
 * @typedef {Object} Program
 * @property {string} startTime 開始時刻
 * @property {string} finishTime 終了時刻
 * @property {number} seconds 秒数
 * @property {ProgramType} type 種別
 * @property {string} title タイトル
 * @property {string} [description] 説明
 * @property {string} [file] 収録ファイル名
 * @property {string} [voiceId] ボイスチャンネルID
 * @property {Array<string>} [userId] ユーザーID
 */

/**
 * スケジュール設定
 * @type {Array}
 */
const scheduledTaskArray = [];
/**
 * @type {Array<Program>}
 */
const scheduledPrograms = [];

/**
 * @type {Program}
 */
let nowPlayingProgram = null;

/**
 *
 * @param {Client} client
 * @param {Program} program
 * @param {VoiceBroadcast} broadcast
 */
const programChange = (client, program, broadcast) => {
  if (program.type === "RECORD" || program.type === "LIVE" || program.type === "OFF_AIR") {
    if (program.type === "RECORD" || program.type === "LIVE") {
      client.user.setPresence({
        activity: { name: `NOW ON AIR!「${program.title}」` },
      });
      nowPlayingProgram = program;
    } else if (program.type === "OFF_AIR") {
      client.user.setPresence({
        activity: { name: "OFF AIR..." },
      });
      nowPlayingProgram = null;
    }

    const joinList = getJoinList();
    for (const dispatcher of broadcast.subscribers) {
      const indexNumber = joinList.findIndex((element) => {
        return element.voice.id === dispatcher.player.voiceConnection.channel.id;
      });
      this.nowPlaying(joinList[indexNumber].text);
    }
  } else if (program.type === "TIME_SIGNAL") {
    return;
  } else {
    logger.error("Unexpexted error has occured.");
  }
};

module.exports = {
  /**
   * Set program schedule.
   * @param {Client} client
   * @param {VoiceBroadcast} broadcast
   */
  set(client, broadcast) {
    // 当日のスケジュールファイル取得
    const now = new Date();
    const schedulePath = `schedules/${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.json`;
    if (fs.existsSync("./" + schedulePath)) {
      /**
       * スケジュール
       * @type {Array<Program>}
       */
      const schedule = require("../" + schedulePath);
      logger.info(`Loaded ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}'s programs.`);
      logger.debug(schedule);

      // 番組スケジュール設定
      const options = { timezone: "Asia/Tokyo" };
      for (const program of schedule) {
        if (program.type === "RECORD") {
          // 収録
          const scheduledTask = cron.schedule(
            program.startTime,
            () => {
              // 収録ファイル取得
              const programPath = `./programs/${program.file}`;
              if (fs.existsSync(programPath)) {
                // 再生
                const dispatcher = broadcast.play(programPath);
                programChange(client, program, broadcast);
                logger.info(`${program.title} is broadcasting!`);
                // 停止時終了処理
                dispatcher.on("finish", () => {
                  logger.info(`${program.title} has finished broadcasting!`);
                  dispatcher.destroy();
                });
              } else {
                logger.fatal("The specified file could not be found.");
              }
            },
            options
          );
          scheduledTaskArray.push(scheduledTask);
        } else if (program.type === "LIVE") {
          // 生放送処理
          const scheduledTask = cron.schedule(
            program.startTime,
            async () => {
              // 放送チャンネル取得
              const channel = await client.channels.fetch(program.voiceId);
              if (channel.type === "voice") {
                // 放送回線開通
                const connection = await channel.join();
                // 放送音声ストリーム開始
                for (const userId of program.userId) {
                  const stream = connection.receiver.createStream(userId, {
                    end: "manual",
                  });
                  logger.debug(stream);
                  // 送信
                  const dispatcher = broadcast.play(stream, { type: "opus" });
                  // 終了処理
                  cron.schedule(
                    program.finishTime,
                    () => {
                      dispatcher.destroy();
                      stream.destroy();
                      connection.disconnect();
                      logger.info(`${program.title} has finished broadcasting!`);
                    },
                    options
                  );
                }
                programChange(client, program);
                logger.info(`${program.title} is broadcasting!`);
              }
            },
            options
          );
          scheduledTaskArray.push(scheduledTask);
        } else if (program.type === "TIME_SIGNAL") {
          const scheduledTask = cron.schedule(
            program.startTime,
            () => {
              // 時報ファイル取得
              const timeSignalPath = "./time_signal/long.wav";
              if (fs.existsSync(timeSignalPath)) {
                // 再生
                const dispatcher = broadcast.play(timeSignalPath);
                logger.info("Time signal is broadcasting!");
                // 停止時終了処理
                dispatcher.on("finish", () => {
                  logger.info("Time signal has finished broadcasting!");
                  dispatcher.destroy();
                });
              } else {
                logger.fatal("The time signal file could not be found.");
              }
            },
            options
          );
          scheduledTaskArray.push(scheduledTask);
        } else if (program.type === "OFF_AIR") {
          const scheduledTask = cron.schedule(
            program.startTime,
            () => {
              programChange(client, program);
            },
            options
          );
          scheduledTaskArray.push(scheduledTask);
        } else {
          logger.fatal("program type is not set.");
          return;
        }
        scheduledPrograms.push(program);
        logger.info(`"${program.title}" was scheduled successfully.`);
        logger.debug(program);
      }
      logger.info(`Completed setting ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}'s programs.`);
    } else {
      logger.fatal("Today's schedule file could not be found.");
    }
  },
  /**
   * Reload program schedule.
   * @param {Message} message
   * @param {Client} client
   * @param {VoiceBroadcast} broadcast
   */
  reload(message, client, broadcast) {
    const crypto = require("crypto");
    const N = 4;
    const randomString = crypto.randomBytes(N).toString("base64").substring(0, N);
    message.channel.send(
      `Are you sure you want to reload the schedule?\nIf you sure, please type \`${randomString}\`.`
    );
    const filter = (m) => m.author === message.author;
    message.channel
      .awaitMessages(filter, { max: 1, time: 30000, errors: ["time"] })
      .then((collected) => {
        if (collected.first().content === randomString) {
          for (const scheduledTask of scheduledTaskArray) {
            scheduledTask.destroy();
          }
          scheduledTaskArray.length = 0;
          this.set(client, broadcast);
          collected.first().channel.send("Schedule was reloaded.");
          logger.info("Schedule was reloaded by owner.");
          logger.debug(scheduledTaskArray);
        } else {
          message.channel.send("Code was not matched. Canceled.");
        }
      })
      .catch(() => {
        message.channel.send("Canceled.");
      });
  },
  /**
   * Show the list of scheduled programs.
   * @param {Message} message
   */
  list(message) {
    const embed = new MessageEmbed().setTitle("Time Table");
    /**
     * @type {Array<import("discord.js").EmbedFieldData>}
     */
    const programFields = [];
    for (const program of scheduledPrograms) {
      if (program.type != "TIME_SIGNAL") {
        /**
         * @type {import("discord.js").EmbedFieldData}
         */
        const field = { name: program.title };
        if (
          Object.keys(program).some((element) => {
            return element === "description";
          })
        ) {
          field.value = program.description;
        } else {
          field.value = "番組情報はありません。";
        }
        programFields.push(field);
      }
    }
    embed.addFields(programFields);
    message.channel.send(embed);
  },
  /**
   *
   * @param {TextChannel} channel
   */
  nowPlaying(channel) {
    const embed = new MessageEmbed().setAuthor("Now Playing");
    if (nowPlayingProgram != null) {
      embed.setTitle(nowPlayingProgram.title).setDescription(nowPlayingProgram.description);
    } else {
      embed.setTitle("OFF AIR...");
    }
    channel.send(embed);
  },
};
