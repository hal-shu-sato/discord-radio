const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "debug";
// eslint-disable-next-line no-unused-vars
const { VoiceChannel, TextChannel, VoiceConnection, Message, VoiceBroadcast } = require("discord.js");
const { nowPlaying } = require("./schedule");

// 登録リスト管理
/**
 * @typedef {Object} JoinData
 * @property {VoiceChannel} voice ボイスチャンネル
 * @property {TextChannel} text テキストチャンネル
 * @property {VoiceConnection} connection ボイス接続
 */
/**
 * @type {Array<JoinData>} 登録中のチャンネルオブジェクト
 */
const joinList = [];
/**
 * リストに登録されているか
 * @param {string} voiceId ボイスチャンネルのID
 * @return {boolean} 登録されているか
 */
const isAddedInList = (voiceId) => {
  return joinList.some((value) => {
    return value.voice.id === voiceId;
  });
};

module.exports = {
  /**
   * Start broadcasting.
   * @param {Message} message
   * @param {VoiceBroadcast} broadcast
   */
  async play(message, broadcast) {
    if (!message.member.voice.channel) {
      message.channel.send("You have to be connected to a voice channel before using this command!");
      logger.info("Requested to broadcast the radio but the requester isn't be connected to any voice channel.");
      return;
    }
    if (!message.member.voice.channel.joinable) {
      message.channel.send("I cannot join your voice channel!");
      logger.info("Requested to broadcast the radio but I can't join the voice channel.");
      return;
    }
    if (!message.member.voice.channel.speakable) {
      message.channel.send("I cannot speak in your voice channel!");
      logger.info("Requested to broadcast the radio but I can't speak the voice channel.");
      return;
    }
    if (isAddedInList(message.member.voice.channel.id)) {
      message.channel.send("I am already broadcasting the radio.");
      logger.info("Requested to broadcast the radio but already broadcasting the radio.");
      return;
    }

    const indexNumber = joinList.push({
      text: message.channel,
      voice: message.member.voice.channel,
    });
    if (isAddedInList(message.member.voice.channel.id)) {
      const connection = await message.member.voice.channel.join();
      connection.play(broadcast);
      joinList[indexNumber - 1].connection = connection;
      message.channel.send("Successful in starting to broadcast the radio!");
      nowPlaying(message.channel);
      logger.info(
        `Successful in starting to broadcast the radio of ${message.member.voice.channel.name} in ${message.guild}.`
      );
      logger.debug(joinList);
    } else {
      message.channel.send("Could not add to joining list. Please contact a developer.");
      logger.error("Couldn't add to joining list.");
      logger.debug(joinList);
    }
  },
  /**
   * Stop broadcasting.
   * @param {Message} message
   */
  stop(message) {
    if (!isAddedInList(message.member.voice.channel.id)) {
      message.channel.send("I am not broadcasting the radio.");
      logger.info("Requested to stop broadcasting the radio but be not broadcasting.");
      return;
    }

    const indexNumber = joinList.findIndex((element) => {
      return element.voice.id === message.member.voice.channel.id;
    });
    joinList[indexNumber].connection.disconnect();
    joinList.splice(indexNumber, 1);
    if (!isAddedInList(message.member.voice.channel.id)) {
      message.channel.send("Successful in stoping broadcasting the radio.");
      logger.info(
        `Successful in stoping broadcasting the radio of ${message.member.voice.channel.name} in ${message.guild}.`
      );
      logger.debug(joinList);
    } else {
      message.channel.send("Could not remove from joining list. Please contact a developer.");
      logger.error(`Couldn't remove ${message.member.voice.channel.name} in ${message.guild} from joining list.`);
      logger.debug(joinList);
    }
  },
  getJoinList() {
    return joinList;
  },
};
