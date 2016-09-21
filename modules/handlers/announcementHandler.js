/* File Name: annoucementHandler.js
*  Author: Alex Garcia
*  Description: Handles annoucements directed towards to all subscribed users.
*  Edit Date: 9/17/16
*/

//Evaluate messages
var eval = require('../evalMess.js');

//Uses some common data in lib.js
var lib = require('../lib.js');

//Sends messages to all users
var formatter = require('../formatter-messenger.js');

//Finds all subscribed users
var sql = require('../sql.js');


function handleAnnouncement(messageEvent, callback) {
	var ret = [];
	
	if( eval.messIsText(messageEvent)) {
		
		var messText = messageEvent.message.text;

		if(messText.substring(0,5) === 'ANC: ') {
			
			sql.getSubbedUsers(function(err, subbedUsers) {
				
				if(err) {
					
				}
				else {
					
					var announcePrecursor = 'TritonFind has an annoucement!';
					var announcement = messText.substring('ANC: '.length, 320 + 'ANC: '.length);

					for(var i = 0; i < subbedUsers.length; i++) {
						ret.push(new formatter.ReplyObjText(subbedUsers[i].userID, announcePrecursor));
						ret.push(new formatter.ReplyObjText(subbedUsers[i].userID, announcement));
					}
					ret.push(new formatter.ReplyObjText(messageEvent.sender.id, 'Announcement Successful.'));

					callback(ret);
				}
			});
		}
	}
	else {
			callback([new formatter.ReplyObjText(messageEvent.sender.id, 'Lol you messed up')]);
	}
}

module.exports = {
	
	handleAnnouncement: handleAnnouncement,
}
