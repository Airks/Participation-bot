const Discord = require('discord.js');
const Sequelize = require('sequelize');
const config = require("./config.json");
const deleteTimeout = 10000;

const client = new Discord.Client();
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite'
});

const Users = sequelize.define('users', {
    id: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    name: Sequelize.STRING,
    score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
});

client.once('ready', () => {
    Users.sync();
    console.log(`Logged in as ${client.user.tag}`);
})

var lastUserID = "";
const prefix = "$";

client.on('message', async msg => {
    // Auto delete the bot messages so the chat won't be full of trash
    if (msg.author.bot){
        msg.delete({timeout: deleteTimeout});
        return;
    };

    // Checking for commands
    if (msg.content.startsWith(prefix)){
        const args = msg.content.split(' ');
        const command = args[0].slice(1);

        switch (command){
            case "ping":
                const timeTaken = Date.now() - msg.createdTimestamp;
                msg.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
            break;

            // For debug purposes only, no cheating
            case "dbg":
                lastUserID = "";
                break;

            case "score":
                if (args.length > 1){
                    args.forEach(async (username) => {

                        if (username == args[0]) return; // Ignore the actual command

                        // Test for the username written as is or with @
                        if (username.includes('@')){
                            const regex = /[<>@!]/gi;
                            id = username.replace(regex, '');
                            dbg(username);
                            var currentUser = await Users.findOne({where: {id: id}});

                        } else {

                            var currentUser = await Users.findOne({where: {name: username}});
                        }

                        if (currentUser === null){
                            msg.reply(username + " doesn't have a score yet.");
                        } else {
                            msg.reply(`${username}'s score is ${await currentUser.score}`);
                        }
                    });

                } else {
                    var currentUser = await Users.findOne({where: {id: msg.author.id}});
                    if (currentUser === null){
                        msg.reply("You don't have a score yet, start talking!");
                    } else {
                        msg.reply(`Your score is ${await currentUser.score}`);
                    }
                }

            break;

            default:
            msg.reply(`Unknown command: ${msg.content.slice(1)}`);
        }
        // Auto delete commands to keep the chat clean
        msg.delete().catch(console.error);
        return;
    }


    if (msg.author.id != lastUserID){
        lastUserID = msg.author.id;

        // Look for the user in the DB
        try {
            const [user, created] = await Users.findOrCreate({
                where: {id: lastUserID},
                defaults: {name: msg.author.username}
            });
            var currentScore = user.get('score') + 1;
            console.log(`${user.get('name')} has a score of ${user.get('score')}`);
        } catch (e) {
            console.log("Creation failed.");
            console.log(e.name + " " + e.message);
        }

        try {
            const affectedRows = await Users.update({ score: currentScore},
            { where: { id: lastUserID } });
            if (affectedRows.length = 0) {
                console.log("Something went wrong.");
            }
        }catch (e){
            console.log("Update failed.");
            console.log(e.name + " " + e.message);
        }
        return;
    }
});

client.login(config.BOT_TOKEN);

function dbg(msg){
    console.log(msg);
}
