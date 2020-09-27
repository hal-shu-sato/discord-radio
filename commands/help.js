// eslint-disable-next-line no-unused-vars
const { MessageEmbed, Message } = require("discord.js");

const embed = new MessageEmbed().setTitle("Radio Bot Help").setDescription("Hello, this is help!");
/**
 * @type {Array<import("discord.js").EmbedFieldData>}
 */
const helpFields = [
  { name: "play", value: "Start to play radio broadcast." },
  { name: "stop", value: "Stop broadcasing the radio." },
];
for (const helpData of helpFields) {
  helpData.inline = true;
}
embed.addFields(helpFields);

module.exports = {
  /**
   *
   * @param {Message} message
   */
  send(message) {
    message.channel.send(embed);
  },
};
