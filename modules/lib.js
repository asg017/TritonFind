/* File Name: lib.js
*  Author: Alex Garcia
*  Description: Holds some commonly used functions/constructors/data that are 
				used throughout the app.
*  Edit Date: 9/18/17
*/

//Uses formatter-messenger to provide common message templates for TritonFind
var formatter = require('./formatter-messenger.js');


//Different tipes of notifications a message can have
var _NOTIF_TYPES = {
	REG : 'REGULAR',
	SILENT : 'SILENT_PUSH',
	NONE : 'NO_PUSH'
}


//All the different user state a user can have in the "users" sql table TODO
var _USER_STATES = {
	
}


//Commmon User Object constructor, to provide some functions
function UserObj(sqlResult) {
	this.userKey = sqlResult.userKey;
	this.userID = sqlResult.userID;
	this.state = sqlResult.state;
	this.workingItem = sqlResult.workingItem;
	this.isSubscribed = function() {return (sqlResult.subscribed === 1); };
	this.lastMess = sqlResult.lastMess;
	this.convo = sqlResult.convo;
	this.isInConvo = function() { return ( this.convo ) };
	this.numItems = sqlResult.numItems;
}

//All types of "Sender actions" that Messenger accepts
var _SENDER_ACTIONS = {
	
	SEEN : 'mark_seen',
	TYPE_ON : 'typing_on',
	TYPE_OFF : 'typing_off',
};

//Array of user ID's of all admins, used for notifying admins of reports
var _ADMINS = 
	[
		process.env.ADMIN_ID,
	];

//Somem emojis that TritonFind uses. TODO add more emojis
var _EMOJIS = {
	BALLOON	: "🎈" ,
	HEART	: "❤️",
}

//Array of all characters users in report ID's
var idChars = 
	[
		"0","1","2","3","4","5","6","7","8","9",
		"A","B","C","D","E","F","G","H","I","J",
		"K","L","M","N","O","P","Q","R","S","T",
		"U","V","W","X","Y","Z","a","b","c","d",
		"e","f","g","h","i","j","k","l","m","n",
		"o","p","q","r","s","t","u","v","w","x",
		"y","z","@","#","$","%","^","&","*","(",
		")","+","~",
	];

//Array of gifs that can be sent when someone says "goodbye"
var goodbyeGifs = [
	'https://asg017.github.io/Projects/TritonFind/pics/bye1.gif',
	'https://asg017.github.io/Projects/TritonFind/pics/bye2.gif',
	'https://asg017.github.io/Projects/TritonFind/pics/bye3.gif',
	'https://asg017.github.io/Projects/TritonFind/pics/bye4.gif',
	'https://asg017.github.io/Projects/TritonFind/pics/bye5.gif'
	]

//fetches random Goodbye Gif
function getRandomByeGif() {
	return goodbyeGifs[getRandomBetween(goodbyeGifs.length-1, 0)];
}

//Source: https://gist.github.com/kerimdzhanov/7529623
//Random number betwnee max/min
function getRandomBetween(max, min){
	return Math.floor(Math.random() * (max - min + 1) + min);
}

//Make random ID from the IDChars array
function getRandomID(size) {
	
	var idStr = '';

	for(var i = 0; i < size; i++) {
		idStr += idChars[ getRandomBetween(idChars.length, 1)-1 ];
	}

	return idStr;

}

/*
 * Formatter of messages sent during a conversation
 * @param senderID - Messenger apge-scope user ID
 * @param textMess - string of text message to send 
 * @param otherUserInfo -USerInfo Object of the user user
 */
function convoFormatter(senderID, textMess, otherUserInfo, notifType) {
	
	//Not sure why I have this, can probably depete
	//var formatter = require('./formatter-messenger.js');

	//Titles of the quick replies
	var qrTitles = ['Send Location',
					'Send Profile Picture',
					'Report ' + otherUserInfo.first_name.substring(0,13),
					'End Conversation'
					];
	//Data for all the quick replies
	var qrData = [ JSON.stringify({locationSend:1}),
					JSON.stringify({profilePicture:1}),
					JSON.stringify({fileReport:1}),
					JSON.stringify({endConvo:1})
					];
	//return ReplyObjQuck of above data
	return new formatter.ReplyObjQuick(senderID, textMess, qrTitles, qrData, null, notifType);

}

//Same as above, but for pictures TODO document this
function convoFormatterPic(senderID, imageURL, otherUserInfo, notifType) {
	
	var formatter = require('./formatter-messenger.js');

	var qrTitles = ['Send Location',
					'Send Profile Picture',
					'Report ' + otherUserInfo.first_name.substring(0,13),
					'End Conversation'
					];
	var qrData = [ JSON.stringify({locationSend:1}),
					JSON.stringify({profilePicture:1}),
					JSON.stringify({fileReport:1}),
					JSON.stringify({endConvo:1})
					];
	return new formatter.ReplyObjPicQuick(senderID, imageURL, qrTitles, qrData, null, notifType);

}

module.exports = {
	NOTIF_TYPES	 		: _NOTIF_TYPES,
	SENDER_ACTIONS 		: _SENDER_ACTIONS,
	USER_STATES			: _USER_STATES,
	UserObj 			: UserObj,
	getRandomID			: getRandomID,
	EMOJIS				: _EMOJIS,
	convoFormatter 		: convoFormatter,
	convoFormatterPic	: convoFormatterPic,
	ADMINS				: _ADMINS,
	getRandomBetween	: getRandomBetween,
	getRandomByeGif		: getRandomByeGif,
}
