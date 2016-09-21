/* File Name: returnHandler.js
*  Author: Alex Garcia
*  Description: Handle's when a user answers as to if an item was returned.
*  Edit Date: 9/18/16
*/

var sql = require('../sql.js');
var formatter = require('../formatter-messenger.js');

function handleReturned(userObj, payloadObj, callback) {
	var ret = [];
	var replyText;
	var returnedObj = payloadObj.returned;
	var convoID = returnedObj.id;
	var response;
	var itemKey = returnedObj.itemKey;

	if(returnedObj.yes) {
		
		replyText = 'Thats\'s awesome! I hope you have a nice day!';
		response = 1;
	}
	else if (returnedObj.willBe) {
		replyText = 'Great to hear, hope you have a nice day!';
		response = 2;
	}
	else if (returnedObj.no) {
		replyText = 'I\'m sorry to hear that! Send me "LiveChat" if you would like to report the other user.';
		response = 3;
	}
	

	sql.fileReturn(convoID, userObj.userKey, itemKey, response, function(err, data) {
		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
	});
	
	
}

module.exports = {
	
	handleReturned	: handleReturned,

}
