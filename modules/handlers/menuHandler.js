/* File Name: menuHandler.js
*  Author: Alex Garcia
*  Description: Handles when a user presses any of the presistent menu options.
*  Edit Date: 9/18/17
*/

//Access database info
var sql = require('../sql.js');

//Send messages back to user
var formatter = require('../formatter-messenger.js');

//Access commonly used data
var lib = require('../lib.js');


function handleMenu(userObj, payloadObj, callback) {
	
	var menuItem = payloadObj.menu;

	if(menuItem.viewItems) {
		handleViewItems(userObj, callback);
	}
	else if(menuItem.checkLost) {
		handleCheckLost(userObj, callback);
	}
	else if(menuItem.registerNew) {
		handleRegisterNew(userObj, callback);
	}
	else if(menuItem.changeSub) {
		handleChangeSub(userObj, callback);
	}
	else if(menuItem.getHelp) {
		handleGetHelp(userObj, callback);
	}

}

function handleChangeSub(userObj, callback) {
	var ret = [];
	var replyText;
	if(userObj.isSubscribed()) {
		replyText = 'You are current subscribed to yout item ' + 
						'updates on TritonFind! If you wish to ' +
						'unsubscribe, click the button below. ';
		var replyText2 = 'Keep in mind, if someone finds your ' +
							'lost item, they will be NOT able to ' +
							'contact you if you unsubscribe.';
		var qrTitles = ['Unsubscribe', 'Cancel'];
		var qrData = [JSON.stringify({unsubscribe:1}), JSON.stringify({cancel:1})];

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText2, qrTitles, qrData));
		callback(ret);
	}
	else {
		
		replyText = 'You are not subscribed to TritonFind! This means ' +
						'that if someone finds one of your items, they ' +
						'will not be able to return it to you. Will you ' +
						'like to subscribe to updates on your items?';
		var qrTitles = ['Subscribe!', 'Cancel'];
		var qrData = [JSON.stringify({subscribe:1}), JSON.stringify({cancel:1})];
		ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));
		callback(ret);
	}

}

function handleCheckLost(userObj, callback) {
	var ret = [];
	var replyText;

	replyText = 'If you find a lost item (i.e. a student ID), simply send me a ' +
					'picture of the barcode and I will tell you if it is ' +
					'registered with TritonFind!';
	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
	callback(ret);
}

function handleGetHelp(userObj, callback) {
	var ret = [];
	var replyText;

	replyText = 'To get more help, visit the TritonFind website to get more information!';
	
	webButton = new formatter.Button('web_url', "TritonFind FAQ's", null, 
						'https://asg017.github.io/Projects/TritonFind/FAQ.html');

	ret.push(new formatter.ReplyObjButton(userObj.userID, replyText, [webButton]));
	callback(ret);

}

function handleRegisterNew(userObj, callback) {
	var ret = [];
	var replyText;

	replyText = 'To register any item with a barcode (i.e. a barcode), simply send me a ' +
					'picture of said barcode to register it with TritonFind!\n' + 
					'If someone ever finds it, I will contact you to ' + 
					'reunite you with the item!';
	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
	callback(ret);
}

function handleViewItems(userObj, callback) {
	var ret = [];
	sql.getAllItems(userObj.userKey, function(err, items) {
		
		if(err) {
			var errReply = 'I\'m sorry, I had an internal error! Can you please try that again?'

			ret.push(new formatter.ReplyObjText(userObj.userID, errReply));

			callback(ret);
		}
		else {
		
			if(!items[0]) {
				var replyText;
				replyText = 'It doesn\'t seem like you have any items ' + 
							'registered with TritonFind! To add an item, ' + 
							'send me a pic of a barcode on your items!';

				ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
				callback(ret);
				return;
			}
			
			var buttonArr = [];
			var genericElementArr = [];
			var genericElement;
			var itemName;

			for (var i = 0; i < items.length; i++) {
				buttonArr = [];

				itemName = (items[i].name)
					? items[i].name
					: 'Your Items #' + i;

				buttonArr.push(new formatter.Button('postback', 'Delete Item', 
					JSON.stringify({deleteItem: 
										{
											itemKey: items[i].itemKey, 
											itemName: items[i].name
										}
									})));

				genericElement = new formatter.GenericElement(itemName, null, 
																null, buttonArr);
				genericElementArr.push(genericElement);
			}

			ret.push(new formatter.ReplyObjGeneric(userObj.userID, genericElementArr));
			callback(ret);
			return;
		}
	});
}

module.exports = {
	handleMenu: handleMenu,
}
