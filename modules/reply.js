/* File Name: reply.js
*  Author: Alex Garcia
*  Description: Determine how to reply to a user based on the message they send.
				Delegates all powers to other modules.
*  Edit Date: 9/18/16
*/

//Accesses User's info in this module
var sql = require('./sql.js');

//Users formatter for error responses
var formatter = require('./formatter-messenger.js');

//Delegate to payloadHandler for payloads
var payloadHandler = require('./handlers/payloadHandler.js');

//Delegate to barcodeHandler when picture is sent
var barcodeHandler = require('./handlers/barcodeHandler.js');

//Delegate to convoHandler when user is in conversation
var convoHandler = require('./handlers/convoHandler.js');

//Delegate to stateHandler if user is in a specific state
var stateHandler = require('./handlers/stateHandler.js');

//Used to evaluate messages
var eval = require('./evalMess.js');


	
function determineReplies(messageEvent, callback) {
	
	//Holds array of messages to send, only used in errors
	var ret = [];

	//Messenger ID of the user
	var senderID = messageEvent.sender.id;
	
	sql.getUserObj(senderID, function(err, userObj) {
		if(err) {
			ret.push(new formatter.ReplyObjText(senderID, 'wtf error yo')); //TODO
			callback(ret);
			return;
		}
		
		//Delegate to convoHandler if in convo
		if(userObj.isInConvo()) {
			convoHandler.handleConvo(userObj, messageEvent, callback);
		}

		else if(eval.messIsText(messageEvent)) {
			stateHandler.handleState(userObj, messageEvent, callback);
		}
		//Message is picture, and user is not in a conversation
		else if( eval.messIsPicture(messageEvent) && !(userObj.state === 'IC' ) ) {
			var imageURL = messageEvent.message.attachments[0].payload.url;
			barcodeHandler.handleBarcode(userObj, imageURL, callback);
		}
		//PayloadHandlers for rest
		else if( eval.messIsQuickReply(messageEvent) && ! eval.qrIsIgnorable(messageEvent) ) {
			payloadHandler.handlePayload(userObj, messageEvent.message.quick_reply.payload, callback);
		}
		else if( eval.messIsPostback(messageEvent) ) {
			payloadHandler.handlePayload(userObj, messageEvent.postback.payload, callback);
		}
			
	});
}	


module.exports = {
	determineReplies: determineReplies,
}
