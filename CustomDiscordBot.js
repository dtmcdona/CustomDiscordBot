/**
 * This is a Discord bot that has useful sections for commands, reports, and chatbot functionality.
 * The chat bot functionality is rather simplistic but still has some value.
 *
 * @link   https://github.com/dtmcdona
 * @file   CustomDiscordBot
 * @author David McDonald
 * @since  5/03/18
 */

//This must be set to the token of your bot from official discord website before your bot can login
var botID = ''; //Don't forget to set your bot token!

//Initialize the JSON arrays
var fs = require('fs');
var fsReports = require('fs');
var fsChat = require('fs');

var txt = fs.readFileSync("./Dictionary/Default_Dictionary.json","UTF-8");
var reportLog = fsReports.readFileSync("./Dictionary/Report_Log.json","UTF-8");
var chatDictionary = fsChat.readFileSync("./Dictionary/Chat_Dictionary.json","UTF-8");

var JsonArrayCommands = JSON.parse(txt);
var JsonArrayReports = JSON.parse(reportLog);
var JsonArrayChat = JSON.parse(chatDictionary);

const readline = require('readline');
const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
    });

var topic;
var command;
var learnTopic = "";
var learnResponse = "";
var learnChatKey = "";
var learnChatResponse = "";
var botTalk = false;

//*****************************************************DISCORD STUFF*****************************************************

const Discord = require('discord.js');
const client = new Discord.Client();
var botTalk = true;
var learningCommand = false;
var learningChatKey = false;
var learningChatResponse = false;
var learning = false;
client.on('ready', () => {
    console.log('The bot is online');
});

client.on('message', message => { 
	//Stops bot from talking to itself
    if (message.author.bot) return;

    //This next bit of code will add key words and responces to your command list in Default_Dictionary.json
    if(message.content.startsWith("!learnCommand")){
        learning = true;
        message.reply("What is the command?");
        return;
    }
    if(learning){
        learningCommand = true;
        learnTopic = message.content
        learning = false;
        message.reply("What is reponse?");
        return;
    }
    if(learningCommand){
        learnResponse = "```" + message.content + "```";
        learnCommand(learnTopic,learnResponse);
        learningCommand = false;
        learnTopic = "";
        learnResponse = "";
        refreshCommands();
        message.reply("Awesome, thanks for teaching me!");
        return;
    }

    
    //This next learning section will apply to if you want a chat bot to learn new keys and responses in Chat_Dictionary.json
    if(message.content.startsWith("!learnChat")){
        learningChatKey = true;
        message.reply("What is the key?");
        return;
    }
    if(learningChatKey){
        learningChatResponse = true;
        learnChatKey = message.content
        learningChatKey = false;
        message.reply("What is reponse?");
        return;
    }
    if(learningChatResponse){
        learnChatResponse = message.content;
        learnChat(learnChatKey,learnChatResponse);
        learningChatResponse = false;
        learnChatKey = "";
        learnChatResponse = "";
        refreshChat();
        message.reply("Awesome, thanks for teaching me!");
        return;
    }
    
    //Search all commands
    if(message.content.startsWith("!search")){
    	command = findCommand(message.content.replace("!search",""));
   		message.reply(JsonArrayCommands[command].response + message.author.username);
    }

    //Report section
    if(message.content.startsWith("!reportInfo")){
        message.reply("Please type !report/<report title>/<description>/<additional information>");
		message.reply("Don't forget to type '/' between the parts of your report." + message.author.username);
        return;
    }
	else if(message.content.startsWith("!report")){
        refreshReports();
		var data = message.content.split("/");
		if(data.length == 4) {
			report(data[1],data[2],data[3]);
			message.reply("Thank you for your report, it has been filed.");
		} else {
			message.reply("There was an error in your report, please type: !reportInfo.");
		}
        return;
    }
	else if(message.content.startsWith("!allReports")){
		refreshReports();
        var keywords = "";
        for (var x = 1;x<JsonArrayReports.length;x++){
            keywords += "```"+JsonArrayReports[x].key +"\n"+JsonArrayReports[x].response +"```\n";
        }
        message.reply("Here is a list of all reports: " + keywords);
        return;
    }
    else if(message.content.startsWith("!commands") || message.content.startsWith("!help")){
        var keywords = "";
        for (var x = 1;x<JsonArrayCommands.length;x++){
            keywords += "!"+JsonArrayCommands[x].key +"\n";
        }
        message.reply('Basic commands are: ```!commands <List of commands> \n !reportInfo <Explains how to create a report> \n !allReports <Lists all the reports> \n !learnCommand <teach command>  \n !learnChat <teach chat bot> \n !search <search for command \n !talk <enable/disable chatbot>```');
        if(keywords != "")
        	message.reply("Here is a list of all custom commands: ```" + keywords + "```");
        return;
    }

    //Chat bot section
    if(message.content.startsWith("!talk")){
    	botTalk != botTalk;
    	if(botTalk) {
    		message.reply('Hello there! ' + message.author.username);
    		return;
    	} else {
    		message.reply('Goodbye ' + message.author.username);
    		return;
    	}
    }
    if(message.content.startsWith("!")){
    	command = findCommand(message.content.replace("!",""));
   		message.reply(JsonArrayCommands[command].response);
   		return;
    }
    if(botTalk){
        topic = findChatKey(message.content);
        message.reply(JsonArrayChat[topic].response);
    }
    
});

client.login(botID);

//**************END OF DISCORD STUFF/START OF MEAT AND POTATOES****************

//This function adds a new command to the list of commands in Default_Dictionary.jsom
function learnCommand(topic,response) {
	refreshCommands();
    var jsonObj = {
        key: [topic],
        response: [response]
    };
    JsonArrayCommands.push(jsonObj);
    var newFile = fs.writeFileSync("./Dictionary/Default_Dictionary.json",JSON.stringify(JsonArrayCommands, null, "\t"));
}

//This function adds a new chat key and respomse to the Chat_Dictionary.json
function learnChat(topic,response) {
	refreshChat();
    var jsonObj = {
        key: [topic],
        response: [response]
    };
    JsonArrayChat.push(jsonObj);
    var newFile = fsChat.writeFileSync("./Dictionary/Chat_Dictionary.json",JSON.stringify(JsonArrayChat, null, "\t"));
}

//This function adds a new report to Report_Log.json
function report(title,description,addtionalInfo) {
	refreshReports();
	var jsonObj = {
        key: [getDateTime()],
        response: ["Title of bug:"+title+" \n Description:"+description+" \n Addtional information:"+addtionalInfo]
    };
    JsonArrayReports.push(jsonObj);
    var newFile = fsReports.writeFileSync("./Dictionary/Report_Log.json",JSON.stringify(JsonArrayReports, null, "\t"));
}

//Checks the command of the sentence and returns its place in the array.
function findCommand(rsp){
	for(var i = 1; i < JsonArrayCommands.length; i++) {
		for(var j = 0; j < JsonArrayCommands[i].key.length; j++) {
			if(rsp.indexOf(JsonArrayCommands[i].key[j]) !== -1) 
				return i;
		}
	}
	return 0;
}

//Checks the topic of the sentence and returns its place in the array.
function findChatKey(rsp){
	for(var i = 2; i < JsonArrayChat.length; i++) {
		for(var j = 0; j < JsonArrayChat[i].key.length; j++) {
			if(rsp.indexOf(JsonArrayChat[i].key[j]) !== -1) 
				return i;
		}
	}
	return 1;
}

//Add text to chat log AND print that text.
function pushLog(text) {
	chatLog.push(text);
	console.log(text);
}

//Returns a random entry of the given array.
function rndArVal(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

//Refreshes the list of commands
function refreshCommands(){
    txt = fs.readFileSync("./Dictionary/Default_Dictionary.json","UTF-8");
    JsonArrayCommands = JSON.parse(txt);
}

//Refreshes the list of reports
function refreshReports(){
    reportLog = fsReports.readFileSync("./Dictionary/Report_Log.json","UTF-8");
    JsonArrayReports = JSON.parse(reportLog);
}

//Refreshes the list of chat keywords and reposonses
function refreshChat(){
    chatDictionary = fsReports.readFileSync("./Dictionary/Chat_Dictionary.json","UTF-8");
    JsonArrayChat = JSON.parse(chatDictionary);
}

//Basic function to get military time and serves as a unique key for reports
function getDateTime() {
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth()+1;
	var day = date.getDate();
	var hour = date.getHours();
	var min = date.getMinutes();
	var seconds = date.getSeconds();
	return month + "/" + day + "/" + year + " Time:" + hour + ":" + min + ":" + seconds;
}