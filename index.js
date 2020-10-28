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
    console.log(`${dateOfPreviousMsg.toLocaleTimeString('fr-FR')} Logged in as ${client.user.tag}`);
})

var lastUserID = "";
var dateOfPreviousMsg = new Date();
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

            // For debug purposes only, no cheating
            case "dbg":
                lastUserID = "";
                break;

            case "score":
                showScore(args, msg);
                break;

            case "update":
                updateUsername(msg);
                break;

            case "leader":
                leaderBoard(msg);
                break;

            default:
                msg.reply(`Unknown command: ${msg.content.slice(1)}`);
        }
        // Auto delete commands to keep the chat clean
        msg.delete()
        /* I have NO IDEA WHY if I delete the comment below, any command sent by the host won't be deleted */
            // .then(msg => console.log("The command has been deleted."))
            .catch(console.error);
        return;
    }

    /* The score is incremented whenever the user talks after another user, or after 1 hour */
    if (msg.author.id != lastUserID || elapsedTimeInHours(msg.createdAt, dateOfPreviousMsg) >= 1) {
        lastUserID = msg.author.id;
        dateOfPreviousMsg = msg.createdAt;

        // Look for the user in the DB
        try {
            const [user, created] = await Users.findOrCreate({
                where: {id: lastUserID},
                defaults: {name: msg.author.username}
            });
            var currentScore = user.get('score') + 1;
            console.log(`${user.get('name')} has a score of ${currentScore}`);
        } catch (e) {
            console.log("Creation failed.");
            console.log(e.name + " " + e.message);
        }

        try {
            // success is the number of affected rows, it should be 1
            const success = await Users.update({ score: currentScore},
            { where: { id: lastUserID } });
            if (success.length == 0) {
                console.log("Something went wrong.");
            }
        }catch (e){
            console.log("Update score failed.");
            console.log(e.name + " " + e.message);
        }
        return;
    }
});

client.login(config.BOT_TOKEN);

async function leaderBoard(msg){
    /* Fetch and sort all the scores from the database */
    var leaderBoard = await Users.findAll({attributes: ['name', 'score']});
    leaderBoard.sort((a, b) => {
        return b.get('score') - a.get('score');
    });

    /* Make the message easily readable */
    var message = "```"
    leaderBoard.forEach((user) => {
        const name = user.get('name');
        const score = user.get('score');
        message += name + " has ".padStart(30 - name.length) + score + "points.\n"
    });
    msg.channel.send(message + "```");
}

async function updateUsername(msg){
    var log = ""
    try {
        const user = await Users.findOne({where: {id: msg.author.id }})
        if (user == null) {
            msg.reply("User not found. Try again after writing some messages.");
        } else {
            log = "User " + user.get('name');
        }
    } catch (e){
        console.log("Connection to DB failed");
        console.log(e.name + " " + e.message);
    }
    try {
        const success = await Users.update({ name: msg.author.username},
            { where: { id: msg.author.id } });
        if (success.length == 0) {
            console.log("updateUsername: User not found");
        } else {
            log += " updated to " + msg.author.username;
            console.log(log);
        }
    } catch (e){
        console.log("Update username failed");
        console.log(e.name + " " + e.message);
    }
}

async function showScore(args, msg){
    if (args.length > 1){
        args.forEach(async (username) => {

            if (username == args[0]) return; // Ignore the actual command

            // Test for the username written as is or with @
            if (username.includes('@')){
                const regex = /[<>@!]/gi;
                id = username.replace(regex, '');
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
}

function elapsedTimeInHours(current, ancient){
    var time = new Date(current.getTime() - ancient.getTime());
    time /= 1000; // time in seconds
    time = Math.floor(time / 60); // time in minutes
    time = Math.floor(time / 60); // time in hours
    if (time >= 1) console.log("Score incremented: more than one hour has passed since last message.");
    return time;
}
function dbg(msg){
    console.log(msg);
}
