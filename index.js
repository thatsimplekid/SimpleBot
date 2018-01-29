/**
 *      SimpleBot V3 - More commands, more better!
 */

const   request     = require('request'),
        snekfetch   = require('snekfetch'),
        Discord     = require('discord.js'),
        _           = require('lodash'),
        fs          = require('fs'),
        ytdl        = require('ytdl-core'),
        math        = require('mathjs'),
        winston     = require('winston'),
        config      = require('./config'),
        version     = require('./package').version,
        commands    = require('./commands'),
        lib         = require('./lib'),
        exec        = require('child_process').exec,
        { Client }  = require('discord.js');

winston.configure({
    transports: [
        new (winston.transports.File)({
            filename: 'winston.log',
            timestamp: function() {
                return +new Date()
            }
        })
    ]
})

global.guildMap     = new Map();
global.client       = new Client();

var timer;

client.login(config.token);

client.on('ready', () => {
    if(!fs.existsSync('guildRecords.json')) {
        fs.writeFileSync('guildRecords.json', JSON.stringify({}, null, '\t'), {});
        var clientGuilds = client.guilds.keyArray();
        for(var i = 0; i < clientGuilds.length; i++) {
            if(!guildMap.has(clientGuilds[i])) {
                guildMap.set(clientGuilds[i],{prefix:config.prefix});
            }
        }
        lib.writeMapToFile(guildMap);
    } else {
        var fileMap = new Map(lib.readFileToMap());
        guildMap = lib.readFileToMap();
        var clientGuilds = client.guilds.keyArray();
        for(var i = 0; i < clientGuilds.length; i++) {
            if(!guildMap.has(clientGuilds[i])) {
                guildMap.set(clientGuilds[i],{prefix:config.prefix});
            }
        }
        if (!_.isEqual(lib.map_to_object(guildMap),lib.map_to_object(fileMap))) lib.writeMapToFile(guildMap);
    }
    console.log(`\n\x1b[32m\x1b[1m// ${config.name} Online and waiting for orders!\x1b[0m`);
    lib.postDiscordBots();
    var i = 0;
    timer = client.setInterval(function(){
        var gamePresence = [
            `with ${client.users.size} Users on ${client.guilds.size} Guilds`,
            `with myself`,
            `~help`,
            `the waiting game`,
            `support me on GitHub!`,
            `https://sb.tsk.fyi/`
        ]
        client.user.setPresence({game:{name:gamePresence[i%gamePresence.length],type:0}});
        i++;
    }, 7500);
    client.setInterval(function() {
        var d = new Date(Date.now());
        console.log(`\n\x1b[32m[${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} | ${d.toLocaleTimeString()}]\x1b[0m Mem: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB | Users: ${client.users.size} | Guilds: ${client.guilds.size}`);
    },300000);
});

client.on('guildCreate', (guild)=>{
    if(!guildMap.has(guild.id)){
        guildMap.set(guild.id,{prefix:config.prefix});
        lib.writeMapToFile(guildMap);
    }
    lib.postDiscordBots();
    if(guild.defaultChannel.permissionsFor(client.user).has('SEND_MESSAGES')) {
        guild.defaultChannel.send({embed:new Discord.MessageEmbed()
        .setTitle(`${client.user.username} is now serving ${guild.name}`)
        .setDescription(``)
        .setThumbnail(client.user.displayAvatarURL)
        .setColor(`${guild.me.displayHexColor!=='#000000' ? guild.me.displayHexColor : config.hexColour}`)});
    }
});

client.on('guildDelete', (guild)=>{
    lib.postDiscordBots();
})

client.on('voiceStateUpdate', (oldMember,newMember)=>{
    if (oldMember.voiceChannel) {
        if (newMember.voiceChannel !== oldMember.voiceChannel) {
            if (newMember.voiceChannel) {
                winston.log('info', `${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} moved from ${oldMember.voiceChannel.name} to ${newMember.voiceChannel.name}`, {guildID: oldMember.guild.id, type: 'voice'});
            } else {
                winston.log('info', `${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} disconnected from ${oldMember.voiceChannel.name}`, {guildID: oldMember.guild.id, type: 'voice'});
            }
        }
    } else {
        if (newMember.voiceChannel !== oldMember.voiceChannel) {
            winston.log('info', `${newMember.nickname ? `${newMember.displayName} (${newMember.user.username})` : newMember.user.username} connected to ${newMember.voiceChannel.name}`, {guildID: newMember.guild.id, type: 'voice'});
        }
    }
})

client.on('messageReactionAdd', (messageReaction,user)=>{
    if (user.bot) return;
})

client.on('messageReactionRemove', (messageReaction,user)=>{
    if (user.bot) return;
});

const commandlist = {

    /**
     *          PUBLIC COMMANDS
     */

    'help': (prefix,message) => {
        var helpText = `
**${prefix}help** - Displays this help text
**${prefix}ping** - Displays ping/latency information
**${prefix}diag** - Displays diagnostic information

**${prefix}invite** - Generates an invite link for SimpleBot

**${prefix}smug** - Posts a smug reaction picture
        `;
        message.channel.send({embed: {
            title: `${message.guild.me.displayName} Commands:`,
            description: helpText,
            color: `${/*message.guild.me.displayHexColor!=='0'?message.guild.me.displayHexColor:*/config.hexColour}`
        }}).catch((err)=>{console.log(err)});
    },
    'ping': (prefix,message) => {
        message.channel.send({embed: {
            title: `Gateway response time: ${Math.round(client.ping)}ms`,
            color: config.hexColour
        }}).catch((err)=>{console.log(err)});
    },
    'diag': (prefix,message) => {
        var textChannels = message.guild.channels.findAll('type','text');
        var voiceChannels = message.guild.channels.findAll('type','voice');
        var textRes = '';
        var voiceRes = '';
        for (var i = 0; i < textChannels.length; i++) {
            textChannels.find(function (channel) {
                if (channel.position===i) {
                    if (channel.name.length+1<38) {
                        var padding = '';
                        for (var x = channel.name.length+1; x < 38; x++) {
                            padding+=' ';
                        }
                        textRes+=`#${channel.name} ${padding}Send ${channel.permissionsFor(client.user).has('SEND_MESSAGES') ? '✔':'✘'} | Read ${channel.permissionsFor(client.user).has('READ_MESSAGES') ? '✔':'✘'}\n`;
                    } else {
                        textRes+=`#${channel.name.slice(0, 37)} Send ${channel.permissionsFor(client.user).has('SEND_MESSAGES') ? '✔':'✘'} | Read ${channel.permissionsFor(client.user).has('READ_MESSAGES') ? '✔':'✘'}\n`;
                    }
                 }
            });
        }
        for (var i = 0; i < voiceChannels.length; i++) {
            voiceChannels.find(function (channel) {
                if (channel.position===i) {
                    if (channel.name.length<38) {
                        var padding = '';
                        for (var x = channel.name.length+1; x < 38; x++) {
                            padding+=' ';
                        }
                        voiceRes+=`${channel.name} ${padding}Speak ${channel.speakable ? '✔':'✘'} | Join ${channel.joinable ? '✔':'✘'}\n`;
                    } else {
                        voiceRes+=`${channel.name.slice(0, 37)} Speak ${channel.speakable ? '✔':'✘'} | Join ${channel.joinable ? '✔':'✘'}\n`;
                    }
                }
            });
        }
        message.channel.send({embed: {
            title: `${config.name} Diagnostics:`,
            fields: [
                {
                    name: `\`\`\`------------------------ Process ------------------------\`\`\``,
                    value: `\`\`\`Uptime  | ${parseInt(client.uptime/86400000)}${parseInt(client.uptime/3600000)%24}:${parseInt(client.uptime/60000)%60}:${parseInt(client.uptime/1000)%60}\nBuild   | v${version}\nMemory  | ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`\`\``
                },{
                    name: `\`\`\`------------------------- Guild -------------------------\`\`\``,
                    value: `\`\`\`ID      | ${message.guild.id}\nRegion  | ${message.guild.region.toUpperCase()}\nPing    | ${Math.round(client.ping)}ms\nMembers | ${message.guild.memberCount}\`\`\``
                },{
                    name: `\`\`\`------------------- TextChannel Perms -------------------\`\`\``,
                    value: `\`\`\`${textRes}\`\`\``
                },{
                    name: `\`\`\`------------------- VoiceChannel Perms ------------------\`\`\``,
                    value: `\`\`\`${voiceRes}\`\`\``
                }
            ],
            color: config.hexColour
        }})
    },
    'invite': (prefix,message) => {
        client.generateInvite(8).then(link => {
            message.channel.send({embed: { 
                description: `Use this [LINK](${link}) to invite me to your own server! :purple_heart: :grin:`,
                color: config.hexColour
            }})
        })
    },

    'smug': (prefix,message) => {
        exec("curl https://smugs.safe.moe/api/v1/i/r", function(e,out,err){
            try {
                out = JSON.parse(out);
                message.channel.send({embed: {
                    "image":{
                        "url": `https://smugs.safe.moe/${out.url}`
                    },
                    description: `Smugs Courtesy of [safe.moe](https://smugs.safe.moe)`,
                    color: config.hexColour
                }})
            } catch (e) {
                message.channel.send({embed: {
                    title: `**ERROR:**`,
                    description: `\`\`\` ${e} \`\`\``,
                    color: config.hexError
                }})
            }
        })
    }

    /**
     *          ADMIN COMMANDS
     */

    /**
     *          OWNER COMMANDS
     */
}


client.on('message', (message)=>{
    if(message.author.bot) return;
    /*
    if (message.channel.type===`dm`)
        return commands.chatbot(client,message.content.split(),message);
    */
    let guildPrefix = config.prefix;
    if (guildMap.has(message.guild.id)) guildPrefix = guildMap.get(message.guild.id).prefix;
    if(!message.content.startsWith(guildPrefix) && !message.content.toLowerCase().startsWith(`sb`)) return;
    let command = message.content.split(/\s+/g)[0].slice(guildPrefix.length);
    let args    = message.content.split(/\s+/g).slice(1);
  
    if (command.toLowerCase() in commandlist){
        console.log(`\x1b[36m[${message.guild}] \x1b[1m${message.author.username}: \x1b[0m${message.content}`);
        commandlist[command](guildPrefix, message);
    }
  
  });