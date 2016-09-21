/* File Name: evalMess.js
*  Author: Alex Garcia
*  Description: Evaluates different "message events" from Messenger to determine 
				what type of message it is. 
*  Edit Date: 9/18/16
*/
function messIsText(messageEvent){
	if ( messEventHasMessage(messageEvent) && messageEvent.message.text ) {
		if( messIsQuickReply(messageEvent)) {
			
			if(qrIsIgnorable(messageEvent)){
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return true;
		}
	}
	else {
		return false;
	}
}

function messEventHasMessage(messageEvent) {
	return ( messageEvent && messageEvent.message );
}

function messHasAttach(messageEvent) {
	return ( messEventHasMessage(messageEvent) && 
				messageEvent.message.attachments && 
				messageEvent.message.attachments[0] );
}
function messIsPicture(messageEvent){
	return ( messHasAttach(messageEvent) && 
				messageEvent.message.attachments[0].type === 'image' );
}
function messIsQuickReply(messageEvent){
	if( messEventHasMessage(messageEvent) && (messageEvent.message.quick_reply) ) {
		return true;
	}
	return false;
}
function messIsLocation(messageEvent){
	return ( messHasAttach(messageEvent) && 
				messageEvent.message.attachments[0].type === 'location' );
}
function messIsPostback(messageEvent){
	return ( messageEvent && messageEvent.postback );
}

function qrIsIgnorable(messageEvent){
	return( messIsQuickReply(messageEvent) &&
				messageEvent.message.quick_reply === 'IG' );
}
module.exports = {
	messEventHasMessage: messEventHasMessage,
	messIsText		: messIsText,
	messHasAttach 	: messHasAttach,
	messIsPicture 	: messIsPicture,
	messIsQuickReply: messIsQuickReply, 
	messIsLocation 	: messIsLocation, 
	messIsPostback 	: messIsPostback,
	qrIsIgnorable 	: qrIsIgnorable

}
