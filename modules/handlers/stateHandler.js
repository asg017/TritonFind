/* File Name: stateHandler.js
*  Author: Alex Garcia
*  Description: Determines replies/actions based on the "state" of a user, 
*				Dependent on context of previous interactions.
*  Edit Date: 9/17/16
*/

//Used to structure messages/responses
var formatter = require('../formatter-messenger.js');

//Used to access/change sql data
var sql = require('../sql.js');

//Used to evaluate messages
var eval = require('../evalMess.js');

//Used to access userInfo
var fbAccess = require('../fbAccess.js');

//Used to hash barcode data
var crypto = require('crypto');

//Delegates to rawHandler if user isn't in state
var rawHandler = require('./rawHandler.js');

//Modular reuse, if needed. tbh I'm just lazy, possibly bad design
var payloadHandler = require('./payloadHandler.js');

/*
 * When user has no other pending actions, evaluate their response based on their 
 * "state", or the context of the last message.
 * @param userObj - User Object with the user's MySQL data
 * @param messageEvent - Instance of the Message Event being dealt with
 * @param callback - function to invoke when complete
 */
function handleState(userObj, messageEvent, callback) {
	
	switch(userObj.state) {
		
		//User was asked to name their item
		case('NI'):
			handleNameItem(userObj, messageEvent, callback);
			break;
		//User was asked to give details on why they are filing a report.
		case('RD'):
			handleReportDetail(userObj, messageEvent, callback);
			break;
		//User was asked if they want to subscribe or not
		case('SB'):
			handleSubAnswer(userObj, messageEvent, callback);
			break;
		//User was asked to type in the ID barcode after failing to scan
		case('MA'):
			handleManual(userObj, messageEvent, callback);
			break;
		//User had no meaningful previous message, so try to parse it
		default:
			rawHandler.handleRaw(userObj, messageEvent, callback);
			break;
	}
}

//TODO Clean this all up
function handleManual(userObj, messageEvent, callback) {
	
	if(eval.messIsText(messageEvent) {
		callback([new formatter.ReplyObjText(userObj.userID, 'I\'m sorry, please type in ' + 
			'the barcode number manually, with a keyboard!')]);
		return;
	}
	var lookupID = messageEvent.message.text; //TODO find way to clean this
	var lookupHash = crypto.createHash(process.env.ENCRYPTION_TYPE).update(process.env.SALT + lookupID, 'latin1').digest('hex');

	var replyText = 'Okay, let me look that up for you, one moment...';
	var ret = [];

	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
	callback(ret);
	
	
	function doRest() {
		sql.getItem(lookupHash, function(err, itemObj) {
			ret = [];
			if(err) {
				console.log('Fuck');
				//TODO
			}
			else {
				var yesPayload;
				var noPayload;
				var qrTitles;
				var qrData;

				sql.updateState(userObj.userKey, null, function(){return;});

				//Item is not in database
				if(! itemObj ) {
					replyText = 'It does not seem like that item is registered with ' +
							'TrionFind! Would you like to register it as ' +
							'your own?';
					yesPayload = JSON.stringify( {registerYes : { item_code : lookupHash } });
					noPayload = JSON.stringify( {registerNo: 1});

					qrTitles = [ 'Yes', 'No' ];
					qrData = [ yesPayload, noPayload ];

					ret.push( new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData) );
					callback(ret);
				}
				//Item is in database
				else {
					
					//The item is registered as the user's
					if(itemObj.userKey === userObj.userKey) {
						replyText = 'This is your item, "' + itemObj.name +'"!\n' + 
							'To view all your items, check out the menu ≡ in the lowerleft!';
						ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
						callback(ret);
						return;
					}
					
					//Item is in database, belongs to someone else.
					replyText = 'That item is registered with TritonFind! Would you ' +
									'like to connect with the owner to reunite them ' +
									'with their items?';
					yesPayload = JSON.stringify( {connectYes : { ownerKey : itemObj.userKey, itemKey : itemObj.itemKey } } );
					noPayload = JSON.stringify( {connectNo: 1});

					qrTitles= ['Yes', 'No'];
					qrData= [yesPayload, noPayload];

					ret.push( new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitlesArr, qrDataArr) );
					callback(ret);
				}
			}
		});
	}
	setTimeout(doRest, 6000);
}
function handleNameItem(userObj, messageEvent, callback) {
	
	var replyText;
	var ret = [];

	if(eval.messIsText(messageEvent)) {
		
		var itemName = messageEvent.message.text.substring(0,30);
		
		sql.updateName(userObj.workingItem, itemName, function(err, data) {
			if(err) {
				repyText = 'I\'m sorry, there were some errors with that name! ' +
								'Do you mind trying again?';
				ret.push( new formatter.ReplyObjText(userObj.userID, replyText));
				callback(ret);
			}
			else {
				
				sql.updateStateAndWorkingItem(userObj.userKey, null,null, function(err, data) {
					
					replyText = 'You have successfully called your item "' + 
									itemName + '"!';
					
					ret.push( new formatter.ReplyObjText(userObj.userID, replyText));
					callback(ret);
				});
			}
		});
	}

	else {
		
		replyText = 'I\'m sorry, you must name your item with a text message! ' +
						'Please try again!';

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
	}
}
		


function handleReportDetail(userObj, messageEvent, callback) {
	ret = [];
	var replyText;

	if(eval.messIsText(messageEvent) ){
		
		var textMess = messageEvent.message.text;

		sql.updateReport(userObj.workingItem, textMess.substring(0,500), function(err, data) {
			sql.updateStateAndWorkingItem(userObj.userKey, null, null, function(err2, data) {
				replyText = 'Your report message has been uploaded. Again, if you ' +
							'wish to contact the UCSDFind team to include more details ' + 
							'on your report, please follow the button below. ';
				var button = new formatter.Button('web_url', 'Contact Us', null, 'http://asg017.github.io/Projects/UCSDFind/Contact.html');

				ret.push(new formatter.ReplyObjButton(userObj.userID, replyText, [button]));
				callback(ret);
			});
		});
	}
	else {
		ret.push(new formatter.ReplyObjText(userObj.userID, 'I can only take down report detail with typed text, please try again!')); //TODO
		callback(ret);
	}

}

function handleSubAnswer(userObj, messageEvent, callback) {	
	var ret = [];
	var replyText;

	if(! (eval.messIsText(messageEvent))) {
		
		return;
	}

	if(/yes|yah|sure|fine|ok/i.test(messageEvent.message.text)) {
		payloadHandler.handlePayload(userObj, JSON.stringify({subscribe:1}), callback);
	}
	else if(/no|nah/i.test(messageEvent.message.text)) {
		payloadHandler.handlePayload(userObj, JSON.stringify({noThanks:1}), callback);
	}
	else {
		replyText = 'I\'m sorry, please say "yes" or "no", or click one of the ' +
						'buttons below to answer!';
		var qrTitles = ['Subscribe!', 'No Thanks'];
		var qrData = [JSON.stringify( {subscribe:1}), JSON.stringify({noThanks:1})];
		
		ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));

		callback(ret);
		return;
	}

	sql.updateState(userObj.userKey, null, function(err, data) {
		if(err) {
			console.log('Fuck alex, do this man'); //TODO
		}
	});
}




module.exports = {
	handleState: handleState,
}
