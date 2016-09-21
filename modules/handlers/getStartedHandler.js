/* File Name: getStartedHandler.js
*  Author: Alex Garcia
*  Description: Handles replies when a user presses the "Get Started" button,
* 				first interactions with most users.
*  Edit Date: 9/18/17
*/

//Insert them into database
var sql = require('../sql.js');

//Send messages back
var formatter = require('../formatter-messenger.js');

//Personalize the experience
var fbAccess = require('../fbAccess.js');

function handleGetStarted(userObj, messageEvent, callback) {
	var ret = [];
	var replyText1;
	var replyText2;
	var replyText3;
	var fName;
	fbAccess.getUserInfo(userObj.userID, function(err, userInfo) {
		
		sql.updateState(userObj.userKey, 'SB', function(err, data) {
			fName = (err) 
				? undefined 
				: userInfo.first_name;

			replyText1 = 'Hello'  + ((fName) ? ' ' + fName : '') + '!' + ' My name is ' +
							'TritonFind, and I help reunite you with your lost items!';

			replyText2 = 'Once you register your items with TritonFind, if it ever ' +
							'becomes misplaced, anyone who finds it will easily ' +
							'get in contact with you!';

			replyText3 = 'First things first, would you like to subscribe to ' +
							'my updates? This means I can contact you when ' +
							'someone finds an item of yours! ';

			var qrTitles = ['Subscribe!', 'No Thanks'];
			var qrData = [JSON.stringify( {subscribe:1}), JSON.stringify({noThanks:1})];
			
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText1));
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
			ret.push(new formatter.ReplyObjQuick(userObj.userID, replyText3, qrTitles, qrData));
			callback(ret);

		});
	});
}

module.exports = {
	handleGetStarted: handleGetStarted,
}
