/* File Name: payloadHandler.js
*  Author: Alex Garcia
*  Description: Handles replies/actions when a payload (such as a quick reply tap,
				button press, or other bot interaction) is received from a user.
*  Edit Date: 9/17/16
*/
//TODO Design this entire file better. Yes/No's should be handled in same 
//functions, possible make a new paylaodHandler directory. Also document 
//all the functions, yo

//Accesses sql data
var sql = require('../sql.js');

//Uses common used functions
var lib = require('../lib.js');

//Used to formatt messages
var formatter = require('../formatter-messenger.js');

//Delegate to menuHandler if it's a menu payload
var menuHandler = require('./menuHandler.js');

//Deleteate to getStartedHandler if it's a getStarted payload
var getStartedHandler = require('./getStartedHandler.js');

//Access User info 
var fbAccess = require('../fbAccess.js');

//Delegate to returnHandler if it's a return paylaod
var returnedHandler = require('./returnHandler.js');

function handlePayload(userObj, payloadStr, callback) {
	//TODO get rid of seperate yes/no methods, you're a bad designer alex
	var payloadObj = JSON.parse(payloadStr);

	if(payloadObj.registerYes) {
		handleRegisterYes(userObj, payloadObj, callback);
	}
	else if (payloadObj.registerNo) {
		handleRegisterNo(userObj, payloadObj, callback);
	}
	else if (payloadObj.scanNonIDYes) {
		handleScanNonIDYes(userObj, payloadObj, callback);
	}
	else if (payloadObj.scanNonIDNo) {
		handleScanNonIDNo(userObj, payloadObj, callback);
	}
	else if (payloadObj.connectYes) {
		handleConnectYes(userObj, payloadObj, callback);
	}
	else if (payloadObj.connectNo) {
		handleConnectNo(userObj, payloadObj, callback);
	}
	else if (payloadObj.inviteYes) {
		handleInviteYes(userObj, payloadObj, callback);
	}
	else if (payloadObj.inviteNo) {
		handleInviteNo(userObj, payloadObj, callback);
	}
	else if(payloadObj.subscribe) {
		handleSubscribe(userObj, payloadObj, callback);
	}
	else if (payloadObj.unsubscribe) {
		handleUnsubscribe(userObj, payloadObj, callback);
	}
	else if (payloadObj.cancel || payloadObj.noThanks) {
		handleCancel(userObj, payloadObj, callback);
	}
	else if (payloadObj.deleteItem) {
		handleDeleteItem(userObj, payloadObj, callback);
	}
	else if (payloadObj.menu) {
		menuHandler.handleMenu(userObj, payloadObj, callback);
	}
	else if (payloadObj.getStarted) {
		getStartedHandler.handleGetStarted(userObj, payloadObj, callback);
	}
	else if (payloadObj.returned) {
		returnedHandler.handleReturned(userObj, payloadObj, callback);
	}
	else if(payloadObj.manualID) {
		handleManualRequest(userObj, callback);
	}
		
}


function handleRegisterYes(userObj, payloadObj, callback) {
	
	var itemCode = payloadObj.registerYes.item_code;
	var replyText;
	var ret = [];

	if(userObj.numItems >= 10) {
		
		replyText = 'I\'m sorry! You can only have up to 10 registered items ' + 
						'with TritonFind! If you would like to get rid of old ' +
						'items, choose "Load My Items" from the menu and delete ' +
						'them!';

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
		return;
	}

	sql.insertNewItem(itemCode, userObj.userKey, function(err, data){
		if(err) {
			//TODO
		}
		else {
			sql.updateStateAndWorkingItem(userObj.userKey, 'NI', data.insertId, function(err, data){
				if(err) {
					//TODO
				}

				else {
					replyText = 'What would you like to name this item? Only 20 ' + 
									'characters, please!';
					
					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
					callback(ret);
					return;

				}
				
			});
		}
	});


}
function handleRegisterNo(userObj, payloadObj, callback) {
	var ret = [];
	var replyText;

	replyText = 'No problem! If it is a lost item, turn it in to the nearest ' +
					'UCSD desk worker!';
	
	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));

	callback(ret);
}

function handleConnectYes(userObj, payloadObj, callback) {
	var otherUserKey = payloadObj.connectYes.ownerKey;
	var itemKey = payloadObj.connectYes.itemKey;
	var ret = [];
	var replyText;

	sql.getUserObjKey(otherUserKey, function(err, otherUserObj) {
		sql.getItemKey(itemKey, function(err2, itemObj) {
			
			if(err || err2) {
				
				replyText = 'I\'m sorry, there was a behind-the-scenes error! ' + 
								'Please try to scan the barcode again!';
				ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
				callback(ret);
				return;
			}


			fbAccess.getUserInfo(otherUserObj.userID, function(err3, otherUserInfo) {
			
		
				if(! otherUserObj.isSubscribed()) {
					
					replyText = 'I\'m sorry! that person is not receiving updates from ' +
									'me anymore. Please return any lost items to any ' +
									'UCSD front desks!';
					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
					callback(ret);
					return;
				}

				else if (otherUserObj.isInConvo()) {
					replyText = 'I\'m sorry, the owner is curently in a conversation! ' +
									'Please try again in a few minutes!';
					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
				}
				else {
					
					//Respond to current user
					replyText = 'A conversation request has been send to the ' +
									'item owner! I\'ll let you know when they respond.';

					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));

					var itemName = (itemObj.name) 
						? 'one of your items'
						: 'your "' + itemObj.name + '"';

					//Respond to item owner

					replyText = 'Hello' + ((err3) ? '' : ' ' + otherUserInfo.first_name) +
									'! Someone has found your "' + itemName + '", and would ' + 
									'like to talk with you to return it. Would ' + 
									'you like to accept their conversation invite?';
					//TODO make sure this doesnt surpass 1000 chars
					var yesPayload = JSON.stringify( { inviteYes : {inviter: userObj, item: itemObj} });
					var noPayload =  JSON.stringify( { inviteNo : {inviterID: userObj.userID } });
					var qrDataArr = [yesPayload, noPayload];
					var qrTitlesArr = ['Yes', 'No'];

					ret.push(new formatter.ReplyObjQuick(otherUserObj.userID, replyText, qrTitlesArr, qrDataArr));

					callback(ret);

				}

			});
		});
	});
}
function handleConnectNo(userObj, payloadObj, callback) {
	var ret = [];
	var replyText = 'No problem! If it is a lost item, please turn it in to the ' +
						'nearest front desk!';
	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
	callback(ret);
}
function handleSubscribe(userObj, payloadObj, callback) {
	var ret = [];
	var replyText1;
	var replyText2;

	sql.subscribeUser(userObj.userKey, function(err, data) {
		sql.updateState(userObj.userKey, null, function(err2, data) {
			if(err || err2) {
				replyText1 = 'Oh fuck'; //TODO
			}
			else {
				replyText1 = 'You have successfully been subscribed to my updates! ' +
								'If someone finds your lost item, you will be ' + 
								'notified!';
				replyText2 = 'To register one of your items, or see if a found lost ' +
								'item is part of TritonFind, simply send me a picture ' +
								'of the barcode at any time!';
				ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
				ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
				
				callback(ret);
			}
		});
	});
}

function handleInviteYes(userObj, payloadObj, callback) {
	var inviterObj = payloadObj.inviteYes.inviter;
	var itemObj = payloadObj.inviteYes.item;

	var ret = [];

	sql.updateToConvo(userObj.userKey, inviterObj.userKey, itemObj.itemKey, function(err, data) {
		sql.updateToConvo(inviterObj.userKey, userObj.userKey, itemObj.itemKey, function(err2, data) {

			if(err || err2 ) {
				//TODO
				console.log('errors');
			}
			else {
				fbAccess.getUserInfo(userObj.userID, function(err, userInfo) {
					fbAccess.getUserInfo(inviterObj.userID, function(err2, inviterInfo) {
						
						if(err || err2) {
							//TODO
							console.log('errors');
						}
						else {
							
							var replyText = 'You are now in a conversation with ' +
												inviterInfo.first_name + '!\n' +
												'To talk, simply message them ' +
												'in this window!';

							ret.push(lib.convoFormatter(userObj.userID, replyText, inviterInfo));

							var replyText = 'You are now in a conversation with ' +
												userInfo.first_name + '!\n' +
												'To talk, simply message them ' +
												'in this window!';

							ret.push(lib.convoFormatter(inviterObj.userID, replyText, userInfo));

							callback(ret);
						}
					});
				});
			}
		});
	});

}

function handleInviteNo(userObj, payloadObj, callback) {
	var inviterID = payloadObj.inviteNo.inviterID;
	var ret = [];

	var replyText = 'You have successfully declined your conversation invite.';

	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));

	replyText = 'The other user has declined your conversation request. ' + 
					'\nPlease return any lost items to the nearest UCSD front desk.';
	ret.push(new formatter.ReplyObjText(inviterID, replyText));

	callback(ret);

	
}
function handleSubscribe(userObj, payloadObj, callback) {
	var ret = [];
	var replyText1;

	sql.subscribeUser(userObj.userKey, function(err, data) {
		if(err) {
			replyText1 = 'I\'m sorry, I had trouble processing that requestion. ' +
							'Can you please try again?'
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
			callback(ret);
		}
		else {
			replyText1 = 'You have successfully been subscribed to TritonFind ' +
						'updates!';
			var replyText2 = lib.EMOJIS.BALLOON;
			var replyText3 = 'I will now be able to message you if someone finds ' + 
								'any of your lost items!';
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText3));
			callback(ret);
		}
	});
	
}
function handleUnsubscribe(userObj, payloadObj, callback) {
	var ret = [];
	var replyText1;

	sql.unsubscribeUser(userObj.userKey, function(err, data) {
		if(err) {
			replyText1 = 'I\'m sorry, I had trouble processing that request. ' +
							'Can you please try again?'
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
			callback(ret);
		}
		else {
			replyText1 = 'You have successfully been unsubscribed to TritonFind ' +
						'updates!';
			var replyText2 = 'Keep in mind, while you are unsubscribed, I will '+
								'not be able to contact you if anyone finds ' + 
								'your lost items.';
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
			callback(ret);
		}
	});
}
function handleCancel(userObj, payloadObj, callback) {
	var ret = [];
	var replyText;
	sql.updateState(userObj.userKey, null, function(err, data) {
		if(err) {
			//TODO
			console.log('you suck alex');
		}

		if(userObj.isSubscribed()) {	
			replyText = 'Awesome, you are still subscibed to TritonFind updates!';
		}
		else {
			replyText = 'Okay, you are still NOT subscribed to TritonFind updates!';
		}

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
	});
}

function handleDeleteItem(userObj, payloadObj, callback) {

	var ret = [];
	var replyText;
	var deleteItemKey = payloadObj.deleteItem.itemKey;
	var itemName = payloadObj.deleteItem.itemName;


	sql.deleteItem(deleteItemKey, function(err, data) {
		if(err) {
			replyText = 'I\'m sorry, couldn\'t process that! May you please ' +
							'try again?';
		}
		else {
			replyText = 'Your "' + itemName + '" has successfully been deleted!';
		}

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
	});
	
}

function handleScanNonIDYes(userObj, payloadObj, callback) {
	var ret = [];
	var replyText;

	var itemCode;

	var yesPayload;
	var noPayload;

	var qrTitles;
	var qrData;

	itemCode = payloadObj.scanNonIDYes.item_code;

	replyText = 'Okay, awesome! It seems like that item is not registered ' + 
					'with TritonFind just yet! Would you like to save it as ' + 
					'yours?';

	yesPayload = JSON.stringify( {registerYes : { item_code : itemCode } });
	noPayload = JSON.stringify( {registerNo: 1});

	qrTitles = [ 'Yes', 'No' ];
	qrData = [ yesPayload, noPayload ];

	ret.push( new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData) );
	callback(ret);

}

function handleManualRequest(userObj, callback) {
	var ret = [];
	var replyText1;
	var replyText2;

	sql.updateState(userObj.userKey, 'MA', function(err, data) {
		if(err) {
			//TODO
		}
		else {
			
			replyText1 = 'Please type in the barcode number for the item you wish ' + 
						'to check! If it\s a UCSD ID, it\'ll start with "21822". ';
			replyText2 = 'Also, avoid accidentally adding spaces around the ID. ' + 
						'For example, send me "123456", not "123456 ".';

			ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
			callback(ret);
		}
	});
}
function handleScanNonIDNo(userObj, payloadObj, callback) {
	var ret = [];
	var replyText1;
	var replyText2;
	var replyText3;
	var button;

	replyText1 = 'Then I\'m sorry, I could not find a UCSD ID barcode in that ' +
				'image! Make sure the following is true: ' + 
				'▪The picture is in portrait\n' +
				'▪There is a lot of light\n' +
				'▪The picture isn\'t blurry, all bars are clear\n' + 
				'▪The barcode is large';
								
	replyText2 = 'Here is an example of a perfect photo to ' + 
						'scan:';
	replyText3 = 'BTW, if you\'d rather type in the barcode code, click this ' + 
					'button. Otherwise, retry sending me a picture!';
	button = new formatter.Button('postback', 'Type It In!', 
									JSON.stringify({manualID:1}));
	

	ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
	ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
	ret.push( new formatter.ReplyObjPicture(userObj.userID, 
		'https://asg017.github.io/Projects/TritonFind/pics/example-correct.png' ));
	ret.push(new formatter.ReplyObjButton(userObj.userID, replyText3, [button]));
	callback(ret);
}




module.exports = {
	
	handlePayload: handlePayload,

}
