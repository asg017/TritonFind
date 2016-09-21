/* File Name: fbAccess.js
*  Author: Alex Garcia
*  Description: Accesses the Messenger User Profile API to get more personal 
				information about a user.
*  Edit Date: 9/18/16
*/


//More info: https://developers.facebook.com/docs/messenger-platform/user-profile

//Request library used to access Messenger API
var request = require('request');


/*
 * Get information about specific user.
 * @param userID - Page-scope Messenger ID for the user of interest.
 * @param callback - function to invoke when complete
 */
function getUserInfo(userID, callback) {
	
	//Page token to user for query
	var pageToken = process.env.PAGE_TOKEN;

	//Only used in testing with Messenger Test Users
	if(process.env.TEST_USERID_1 === userID) {	
		
		pageToken = process.env.TEST_PAGE_TOKEN_1;
	}
	
	//String to request
	var requestStr = "https://graph.facebook.com/v2.6/" + userID + 
				"?fields=first_name,last_name,profile_pic&access_token=" + 
				pageToken;

	//Will hold info about the user (used to capture a facebook error)
	var userInfo;
	
	//Request it
	request(requestStr, function(error, response, body) {

		if(error) {
			console.log('REQUEST ERROR: ' + error.message);
			callback(error);
		}

		userInfo = JSON.parse(body);

		//Error is accessing userInfo, but not Request error
		if(userInfo.error) {
			console.log('FB ACCESS ERROR: ' + JSON.stringify(userInfo.error));
			callback(true);
		}
		else {
			callback(null, userInfo);
		}
	});
	
}

module.exports = {
	getUserInfo: getUserInfo,
}
