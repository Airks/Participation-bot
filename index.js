const Discord = require('discord.js');
const Keyv = require('keyv');
const config = require("./config.json");
const deleteTimeout = 10000;

const client = new Discord.Client();
const keyv = new Keyv('sqlite://./database.sqlite')
keyv.on('error', err => console.error('Keyv connection error:', err));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

var lastUserID = "";
const prefix = "$";

client.on('message', async msg => {
  // Auto delete the bot messages so the chat won't be full of trash
  if (msg.author.bot){
    msg.delete({timeout: deleteTimeout});
    return;
  };

  if (msg.content.startsWith(prefix)){
    const args = msg.content.split(' ');
    const command = args[0].slice(1);


    switch (command){
      case "ping":
        const timeTaken = Date.now() - msg.createdTimestamp;
        msg.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
        break;

      case "score":
        msg.reply(`Your score is ${await getScore(msg.author.id)}`);
        break;

      default:
        msg.reply(`Unknown command: ${msg.content.slice(1)}`);
    }
    msg.delete().catch(console.error);
    return;
  }


  if (msg.author.id != lastUserID){
    lastUserID = msg.author.id;
    var currentScore = await getScore(lastUserID);
    await keyv.set(lastUserID, currentScore + 1);

    console.log(`User ${msg.author.username}, score: ${currentScore + 1}`);
  }

});

client.login(config.BOT_TOKEN);

async function getScore(userID) {
  if (await keyv.get(userID) != undefined){
    return await keyv.get(userID);
  } else {
    return 0;
  }
}
