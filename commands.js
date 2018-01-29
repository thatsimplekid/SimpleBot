/**
 *      SimpleBot V3 - More commands, more better!
 */

const   request     = require('request'),
        Discord     = require('discord.js'),
        _           = require('lodash'),
        fs          = require('fs'),
        config      = require('./config'),
        lib         = require('./lib');

class Commands {

    help(client,prefix,message){
        var helpText = `
        **${prefix}help** - Displays this help text
        **${prefix}ping** - Displays ping/latency information
        **${prefix}diag** - Displays diagnostic information
        `;
        var helpEmbed = new Discord.MessageEmbed()
        .setTitle(message.guild.me.displayName + "Commands:")
        .setDescription(helpText);
        message.channel.send({client:client,embed:helpEmbed}).bind();
        //.setImage()               /* TODO:: ADD IMAGE BANNER *//
        //.setColor(`${message.guild.me.displayHexColor!=='#000000'?message.guild.me.displayHexColor:config.hexColour}`)});
    }

    ping(prefix,message){
        message.channel.send("Test");
    }

    diag(prefix,message){

    }

}

module.exports = new Commands();