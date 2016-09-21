/* File Name: reportHandler.js
*  Author: Alex Garcia
*  Description: Handles when a user decides to file a report against another
				user.
*  Edit Date: 9/18/16
*/

//Send messages back
var formatter = require('../formatter-messenger.js');

//Acess sql database to store
var sql = require('../sql.js');

//access commonly used stuff
var lib = require('../lib.js');

function handleReport(userObj, otherUserObj, userInfo, otherUserInfo, 
							payloadObj, messageEvent, callback) {
	
	var reportObj = payloadObj.report;

	if(reportObj.yes) {
		handleYes(userObj, otherUserObj, userInfo, otherUserInfo,reportObj,
														messageEvent, callback);
	}
	else if(reportObj.no) {
		handleNo(userObj, otherUserObj, userInfo, otherUserInfo,reportObj, callback);
	}
	else if(reportObj.more) {
		handleMore(userObj, otherUserObj, userInfo, otherUserInfo,reportObj, callback);
	}
	else if (reportObj.endOnly) {
		handleEndOnly(userObj, otherUserObj, userInfo, otherUserInfo,reportObj, callback);
	}
}


function handleMore(userObj, otherUserObj, userInfo, otherUserInfo, reportObj, callback) {
	var ret = [];
	var replyText;
		
	sql.endConvo(userObj, function(err1, data) {
		if(err1) {
			//TODO handle this please
		}
		else {
			
			//Don't prompt for anything else
			ret.push(new formatter.ReplyObjText(otherUserObj.userID,
					userInfo.first_name + ' has ended the conversation.'));

			
			sql.updateStateAndWorkingItem(userObj.userKey, 'RD', reportObj.itemKey, function(err2, data) {
				
				if(err2) {
					//TODO
				}
				else {
					
					replyText = 'You have 500 characters to include any more information ' + 
									'on your report against ' + otherUserInfo.first_name + '.';
					var moreInfo = 'To include more detail, including more ' + 
									'commentary, screenshots, or backstory, ' + 
									'please contact us on our website. ' ;
					var button = new formatter.Button('web_url', 'Contact Us', 
							null, 'https://asg017.github.io/Projects/TritonFind/contact.html');

					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
					ret.push(new formatter.ReplyObjButton(userObj.userID, moreInfo, [button]));
					callback(ret);
				}
			});
		}
	});
}
function handleEndOnly(userObj, otherUserObj, userInfo, otherUserInfo,reportObj, callback) {
	var ret = [];

	sql.endConvo(userObj, function(err, data) {
		if(err) {
			
		}
		else {
			ret.push(new formatter.ReplyObjText(otherUserObj.userID, 
						userInfo.first_name  + ' has ended the conversation.'));

			var replyText = 'The conversation has ended, and your report has ' + 
							'been filed. If you wish to contact the UCSDFind team, ' +
							'please see our "Contact Us" page on our website. ';

			var button = new formatter.Button('web_url', 'Contact Us',null, 
				'https://asg017.github.io/Projects/TritonFind/contact.html');
			ret.push(new formatter.ReplyObjButton(userObj.userID, replyText, [button]));
			callback(ret);

		}
	});
}

function handleYes(userObj, otherUserObj, userInfo, otherUserInfo,reportObj, messageEvent, callback){ 
	var ret = [];
	var replyText;
	var qrTitles;
	var qrData;
	var timestamp = messageEvent.timestamp;

	
	sql.makeReport(userObj.userKey, otherUserObj.userKey, timestamp, function(err, data) {
		if(err) {
			//TODO crap
		}
		else {
			
			replyText = 'A report has been filed against ' + otherUserInfo.first_name + 
							'. If you wish to include more information, ' + 
							'please choose that option below. It will also ' + 
							'end you conversation with ' + otherUserInfo.first_name + 
							'. To just end your conversation, choose the other option. '; //TODO
			qrTitles = ['Include More Details', 'End Conversation'];

			qrData = [ JSON.stringify({report: {more:1, itemKey: data.insertId}}),
						JSON.stringify({report: {endOnly:1}})];
			var adminStr = userInfo.first_name + ' ' + userInfo.last_name + 
					' has filed a report against ' + otherUserInfo.first_name + 
					' ' + otherUserInfo.last_name + ' at ' + timestamp + '. ' + 
					'Report Key is ' + data.insertId + '.';

			for(var i = 0; i < lib.ADMINS.length; i++) {
				ret.push(new formatter.ReplyObjText(lib.ADMINS[i], adminStr, 
											lib.NOTIF_TYPES.SILENT));
			}	

			ret.push( new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData));


				
			callback(ret);
		}
	});
}

function handleNo(userObj, otherUserObj, userInfo, otherUserInfo, reportObj, callback){ 
	var ret = [];
	var replyText;

	replyText = 'Okay, no report will be filled against ' + otherUserInfo.first_name + '!';

	ret.push(lib.convoFormatter(userObj.userID, replyText, otherUserInfo));
	callback(ret);
}
module.exports = {
	handleReport: handleReport,
}
