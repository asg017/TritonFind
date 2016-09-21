/* File Name: rawHandler.js
*  Author: Alex Garcia
*  Description: When a user does not have a state (i.e. no meaningful previous 
				interaction), decide how to respond.
*  Edit Date: 9/18/16
*/
var formatter = require('../formatter-messenger.js');
var eval = require('../evalMess.js');
var fbAccess = require('../fbAccess.js');
var lib = require('../lib.js');
var payloadHandler = require('./payloadHandler.js');


function handleRaw(userObj, messageEvent, callback) {

	if(eval.messIsText(messageEvent)) {

		var textMess =  messageEvent.message.text;

		switch(true) {
			//They want to unsubscribe (probably)
			case(/unsub|stop/i.test(textMess)):
				handleUnsub(userObj, callback);
				break;
			//Probably want to sign up
			case(/subscribe|signup|sign.up/i.test(textMess)):
				handleSubscribe(userObj, callback);
				break;
			//User needs help
			case(/help/i.test(textMess)):
				handleHelp(userObj, callback);
				break;
			//ser wants to LiveChat with an admin
			case(/live\s?chat/i.test(textMess)):
				handleLiveChat(userObj, callback);
				break;
			//A little hello thing
			case( /hey|hi|hello|sup|s up/i.test(textMess)):
				handleHello(userObj, callback);
				break;
			//I really do love them
			case( /i love (you|ya)/i.test(textMess)):
				handleLove(userObj, callback);
				break;
			//fine, leave then
			case( /bye|goodbye|see ya|bai/i.test(textMess)):
				handleBye(userObj, callback);
				break;
			//view items
			case( /view my item/i.test(textMess)):
				//to lazy to reqrite
				payloadHandler.handlePayload(userObj, 
							JSON.stringify({menu: {viewItems:1}}), callback);
				break;
			//No idea what they want
			default: 
				handleDefault(userObj, messageEvent, callback);
				break;
		}
	}
}

//TODO, make this workable!
function handleLiveChat(userObj,callback) {
	var ret = [];
	var replyText;

	replyText = 'I\'m sorry, I cannot do that feature quite yet! I\'ll let you ' + 
	            'know when I get smart enough! Feel free to message TritonFind\'s' + 
				'creator here:';

	var webButton = new formatter.Button('web_url', "TritonFind Creator", null, 
						'https://www.m.me/100001067662345');

	ret.push(new formatter.ReplyObjButton(userObj.userID, replyText, [webButton]));
	callback(ret);
}

function handleBye(userObj, callback) {
	var ret = [];
	var replyText;

	fbAccess.getUserInfo(userObj.userID, function(err, userInfo) {
		
		if(err) {
			replyText = 'Goodbye, until next time!';
		}
		else {
			replyText =  'Goodbye, ' + userInfo.first_name + '! See ya soon!';
		}

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		ret.push(new formatter.ReplyObjPicture(userObj.userID, lib.getRandomByeGif()));
		callback(ret);

	});
}
function handleLove(userObj, callback) {
	var ret = [];
	var replyText;

	fbAccess.getUserInfo(userObj.userID, function(err, userInfo) {
		
		replyText = 'I love you too';
		if(err) {
			replyText += '!';
		}
		else {
			replyText +=  ', ' + userInfo.first_name + '!';
		}

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		ret.push(new formatter.ReplyObjText(userObj.userID, lib.EMOJIS.HEART));
		callback(ret);

	});
}
function handleHelp(userObj, callback) {
	var ret = [];
	var replyText;
	var webButton;

	replyText = 'If you want to register your ID, send me a picture of the ' + 
				'barcode!\n If you want more options, check out the menu (≡) ' + 
				'in the lower left, or check out my FAQ\'s below!';

	webButton = new formatter.Button('web_url', "TritonFind FAQ's", null, 
			'https://asg017.github.io/Projects/TritonFind/FAQ.html');

	ret.push(new formatter.ReplyObjButton(userObj.userID, replyText, [webButton]));
	callback(ret);

}


function handleHello(userObj, callback) {
	var ret = [];
	var replyText;

	var greetings = ['Hey', 'Hi', 'Hello there', 'What\'s up'];
	var helps = ['What can I help you with today?', 'What can I do for you?',
					'How may I assist you today?'];

	
	fbAccess.getUserInfo(userObj.userID, function(err, userInfo) {
		
		replyText = greetings[lib.getRandomBetween(greetings.length-1, 0)];

		if(err) {
			replyText += '! ';
		}
		else {
			replyText += ' ' +  userInfo.first_name + '! ';
		}

		replyText += helps[lib.getRandomBetween(helps.length-1, 0)];

		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
	});

}


function handleDefault(userObj, messageEvent, callback) {
	var ret = [];
	var replyText;
	replyText = 'I\'m sorry, I couldn\'t process that! Please refer to the menu ' + 
				'in the lowerleft (≡) to see your options!';
	
	ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
	callback(ret);
}


function handleSubscribe(userObj, callback) {
	var ret = [];
	var replyText;
	
	if(userObj.isSubscribed() ) {
		replyText = 'You are already subscribed to TritonFind updates!';
		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		callback(ret);
		return;
	}

	qrTitles = ['Subscribe', 'No Thanks'];
	qrData = [JSON.stringify({subscribe:1}),
				JSON.stringify({cancel:1}) ];
	replyText = 'Click below to subscribe to TritonFind updates!';

	ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));
	callback(ret);
}


function handleUnsub(userObj, callback) {
	var ret = [];
	var replyText;
	
	if(! userObj.isSubscribed() ) {
		replyText = 'You are already unsubscribed to TritonFind updates!';
		var replyText2 = 'Please reconsider your subscription, I will not be ' +
							'able to contact you when you are unsubscribed, ' + 
							'so your lost items will be kept lost!';
		ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
		ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
		callback(ret);
		return;
	}

	qrTitles = ['Unsubscribe', 'Keep Subscribed!'];
	qrData = [JSON.stringify({unsubscribe:1}),
				JSON.stringify({cancel:1}) ];
	replyText = 'Click below to confirm your unsubscription. This means I can\'t ' + 
					'message you when someone finds your lost items.';

	ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));
	callback(ret);	
}


module.exports = {
	handleRaw : handleRaw,
}
