/* File Name: convoHandler.js
*  Author: Alex Garcia
*  Description: Handles how to reply when a user is in a conversation, from 
				text/payloads.
*  Edit Date: 9/17/16
*/

//Accesses stored info about other user
var sql = require('../sql.js');

//Access a common format for all conversation messages
var lib = require('../lib.js');

//Sends Messages
var formatter = require('../formatter-messenger.js');

//Evaluate type of messages
var eval = require('../evalMess.js');

//Access first name/profile picture for theusers
var fbAccess = require('../fbAccess.js');

//Delegate if report is filed.
var reportHandler = require('./reportHandler.js');

function handleConvoErrHandler(userObj, callback) {
	
	var ret = [];
	var replyText;

	replyText = 'I\'m sorry, I was not able to send that! May you please try again?';

	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
	callback(ret);
}

function handleConvo (userObj, messageEvent, callback) {
	
	sql.getUserObjKey(userObj.convo, function(err1, otherUserObj) {
		if(err1) {
			
			handleConvoErrHandler(userObj, callback);
			return;
		}

		fbAccess.getUserInfo(userObj.userID, function(err2, userInfo) {
			if(err2) {
				handleConvoErrHandler(userObj, callback);
				return;
			}

			fbAccess.getUserInfo(otherUserObj.userID, function(err3, otherUserInfo) {
				if(err3) {
					handleConvoErrHandler(userObj, callback);
					return;
				}

					switch(true) {
						
						case(eval.messIsText(messageEvent)) :
							handleText(userObj, otherUserObj, userInfo, otherUserInfo, messageEvent, callback);
							break;

						case(eval.messIsLocation(messageEvent)) :
							handleLocation(userObj, otherUserObj, userInfo, otherUserInfo, messageEvent, callback);
							break;

						case(eval.messIsQuickReply(messageEvent) || eval.messIsPostback(messageEvent)) :
							handlePostback(userObj, otherUserObj, userInfo, otherUserInfo,messageEvent, callback);
							break;
						default:
							handleBadInput(userObj,otherUserObj, userInfo, otherUserInfo, messageEvent, callback);
							break;
					}

				});
			});
		});
	
	
}

function handleText (userObj, otherUserObj, userInfo, otherUserInfo, messageEvent, callback) {
	var ret = [];
	var textMessage = messageEvent.message.text;

	
	var charLimit = 320 - userInfo.first_name.length - 2;
	var responseSen = '✅';
	var responseRec = userInfo.first_name + ': ' + textMessage.substring(0, charLimit);

	ret.push(lib.convoFormatter(userObj.userID, responseSen, otherUserInfo, lib.NOTIF_TYPES.NONE));
	ret.push(lib.convoFormatter(otherUserObj.userID, responseRec, userInfo));
	

	if((textMessage.length + userInfo.first_name.length + 2) > 320) {

		var warning = 'WARNING: your message may have been cut ' + 
						'short. You have a limit of ' + charLimit + 
						' characters before your messages are shortened. \n' +
						'You can always spread out and send ' + 
						'multiple, shorter messages during a ' +
						'conversation.';

		ret.push(lib.convoFormatter(userObj.userID, warning, otherUserInfo, lib.NOTIF_TYPES.NONE));
	}


	callback(ret);
			

			
		

}
function handleLocation (userObj, otherUserObj, userInfo, otherUserInfo,messageEvent, callback) {
	var ret = [];
	var replyText;
	var lat = messageEvent.message.attachments[0].payload.coordinates.lat;
	var long = messageEvent.message.attachments[0].payload.coordinates.long;


	replyText = 'Sending your location was a success!';

	var imageURL = 'https://maps.googleapis.com/maps/api/staticmap?size=764x400' + 
						'&center='+lat+','+long+'&zoom=20&markers='+lat+','+long;

	var mapURL = 'http://maps.apple.com/maps?q='+lat+','+long+'&z=16';

	var button  = new formatter.Button('web_url', 'Get Directions', null, mapURL);

	var genericElement = new formatter.GenericElement( userInfo.first_name + '\s Location', imageURL, userInfo.first_name + ' has sent their location to you!', [button]);

	ret.push(lib.convoFormatter(userObj.userID, replyText, otherUserInfo));
	ret.push(new formatter.ReplyObjGeneric(otherUserObj.userID, [genericElement]));

	callback(ret);

}
function handlePostback (userObj, otherUserObj, userInfo, otherUserInfo,messageEvent, callback) {
	
	var payload;
	if(eval.messIsPostback(messageEvent)) {
		payload = messageEvent.postback.payload;
	}
	else {
		payload = messageEvent.message.quick_reply.payload;
	}
	var payloadObj = JSON.parse(payload);
	console.log('payload Obj: ' + JSON.stringify(payloadObj));

		if(payloadObj.locationSend) {
			handlePyldLocSend(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback);
		}
		else if(payloadObj.profilePicture) {
			handlePyldProfPic(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback);
		}
		else if(payloadObj.fileReport) {
			handlePyldReport(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback);
		}
		else if(payloadObj.endConvo) {
			handlePyldEndConvo(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback);
		}
		else if(payloadObj.endYes) {
			handlePyldEndYes(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback);
		}
		else if(payloadObj.endNo) {
			handlePyldEndNo(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback);
		}
		else if(payloadObj.report) {
			reportHandler.handleReport(userObj, otherUserObj, userInfo, otherUserInfo, payloadObj, messageEvent, callback);
		}
}
function handlePyldLocSend(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback){ 
	var ret = [];
	var replyText;
	replyText= 'To send your location, choose the "Location" option in ' +
					'Messengers menu below this mesage!';
	
	ret.push(lib.convoFormatter(userObj.userID, replyText, otherUserInfo));
	callback(ret);
}

function handlePyldProfPic(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback){ 
	var ret = [];
	var replyTextSen;
	var replytextRec;
	var imageURL;
	
	imageURL = userInfo.profile_pic;
	replyTextSen = 'Your profile picture was successfully sent to ' + otherUserInfo.first_name + '!';
	replyTextRec = 'This is ' + userInfo.first_name + '\'s profile picture!';


	ret.push(lib.convoFormatter(otherUserObj.userID, replyTextRec, userInfo));
	ret.push(lib.convoFormatterPic(otherUserObj.userID, imageURL, userInfo));
	ret.push(lib.convoFormatter(userObj.userID, replyTextSen, otherUserInfo));
	callback(ret);
				
}

function handlePyldReport(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback){ 
	var ret = [];
	var replyText = 'Are you sure you wish to report ' + otherUserInfo.first_name + '?';

	var qrYesPayload = JSON.stringify( {report: {yes:1} } );
	var qrNoPayload = JSON.stringify( {report: {no:1} } );
	var qrTitles = ['Yes', 'No'];
	var qrData = [qrYesPayload, qrNoPayload];
	ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));
	callback(ret);

}

function handlePyldEndConvo(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback){ 
	var ret = [];
	var replyText = 'Are you sure you wish to end your conversation with ' + 
						otherUserInfo.first_name + '?';

	var qrYesPayload = JSON.stringify( {endYes: 1} );
	var qrNoPayload = JSON.stringify( {endNo: 1} );
	var qrTitles = ['Yes', 'No'];
	var qrData = [qrYesPayload, qrNoPayload];
	ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));
	callback(ret);
}

function handlePyldEndYes(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback){ 
	var ret = [];
	var replyText;
	sql.endConvo(userObj, function(err,data) {
		if(err) {
			handleConvoErrHandler(userObj, callback);
			return;
		}

		else {
		
		
			replyText = 'Your conversation with ' + otherUserInfo.first_name + 
							' has ended! Was the item returned?';
			var qrTitles = ['Yes', 'Will be Returned', 'No'];

			var convoID = lib.getRandomID(4);
			var returnYes = {returned: {yes:1, id:convoID, itemKey:userObj.workingItem}};
			var returnWillBe = {returned: {willBe:1, id:convoID, itemKey: userObj.workingItem}}; //TODO
			var returnNo = {returned: {no:1, id:convoID, itemKey: userObj.workingItem}};

			var qrData = [JSON.stringify(returnYes), 
							JSON.stringify(returnWillBe), 
							JSON.stringify(returnNo)];

			ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));

			replyText = userInfo.first_name + ' has ended the conversation! ' + 
							'Was the item returned?';

			ret.push(new formatter.ReplyObjQuick(otherUserObj.userID, replyText, qrTitles, qrData));

			callback(ret);
		}
	});
}

function handlePyldEndNo(userObj, otherUserObj, userInfo, otherUserInfo,payloadObj, callback){ 
	var ret = [];
	var replyText;
	

	replyText = 'No problem, your conversation with ' + otherUserInfo.first_name +
						' is still in session!';

	ret.push(lib.convoFormatter(userObj.userID, replyText, otherUserInfo));
	callback(ret);
}







function handleBadInput (userObj, otherUserObj, userInfo, otherUserInfo,messageEvent, callback) {
	var ret = [];
	var replyText;

	replyText = 'I\'m sorry, I cannot send that during a conversation!';
	ret.push(lib.convoFormatter(userObj.userID, replyText, otherUserInfo));
	callback(ret);
}

module.exports = {
	handleConvo: handleConvo,
}
