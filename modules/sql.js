/* File Name: sql.js
*  Author: Alex Garcia
*  Description: Handle's all MySql connections and queries for TritonFind.
*  Edit Date: 9/18/16
*/
'use strict';

//Uses mysql library, direct access
var mysql = require('mysql');

//Uses lib for some constructors
var lib = require('./lib.js');


//MySQL pool, for multiple connections
var pool = mysql.createPool({
		connectionLimit  : 10,
  		host    		: process.env.DB_HOST,
    	user   			: process.env.DB_USERNAME,
	  	password 		: process.env.DB_PASSWORD,
	    database		: process.env.DB_DATABASE_NAME,	
		charset			: 'utf8mb4_unicode_ci' //To allow Messenger Emojis
});


/**
 * Connects and queries the MySql Database.
 * @param sqlString - A string containing a SQL query.
 * @param inputArray - Array containing input values for the sqlString (replaces ?'s)
 * @param callback - function to invoke after completion.
 */
function connectAndQuery(sqlString, inputArray, callback){
	
	//Uncomment line to debug SQL queries
	//console.log('Executing ' + sqlString.replace('\n', '') + ' with ' + inputArray.join(','));

	//Connect to pool
	pool.getConnection( function afterPoolConn(err, connection) {
		if(err){
			console.log('POOL.GETCONNECTION ERROR: SEVERE. ' + err.message);
			callback(err);
			return;
		}
		else{
			
		//Execute query
			connection.query(sqlString, inputArray, function afterConnQuery(err,result, fields){
				if(err){
					console.log('CONNECTION.QUERY ERROR: SEVERE. ' + err.message);
					connection.release();
					callback(err);
					return;
				}
				else{
					connection.release();
					callback(err, result);
					return;
				}
			});
		}
	});
}


/**
 * Insert user into the database.
 * @param senderID - String of the user's page scoped Messenger ID.
 * @param callback - Function to invoke when complete.
 */ 
function uploadUser(senderID, callback) {
	
	//sqlString to execute. Insert user into users table.
	var sqlStr = 'INSERT INTO users (userID) VALUES (?)';
	//Paramter array for the sqlString. replaces the ?'s
	var paramArr = [senderID];

	//Execute query
	connectAndQuery(sqlStr, paramArr, function(err, result) {
		if(err) {
			callback(err);
		}

		//If successfull, return that user.
		else {
			//TODO do I really need to perform anoter query?
			sqlStr = 'SELECT * FROM users WHERE userID = ?';
			paramArr = [senderID];
			connectAndQuery(sqlStr, paramArr, function(err, data){
				callback(err, new lib.UserObj(data[0]));
			});

		}
	});
}

/* 
 * Get a user's info from the database given their userKey.
 * @param userKey - Key of the user that will be returned/
 * @param callback - Function to invoke when complete.
 */
function getUserObjKey(userKey, callback) {
	
	//sqlString to be executed. If i was better at SQL, this might be shorter.
	var sqlStr = 'SELECT ' +
					'u.userKey, ' +
					'u.userID, ' +
					'u.state, ' +
					'u.workingItem, ' +
					'u.subscribed, ' +
					'u.lastMess, ' +
					'u.convo, ' +
					'COUNT(i.itemKey) AS numItems ' +
				'FROM users u ' +
				'LEFT JOIN items i ' +
					'ON (u.userKey = i.userKey) ' +
				'WHERE u.userKey=?';
	//Parameter Array for sqlStr. Replaces the ?'s
	var paramArr = [userKey];
	

	//Execute, callback the result
	connectAndQuery(sqlStr, paramArr, function(err, result) {
		if(err) {
			callback(err);
		}
		else {
				callback(null, new lib.UserObj(result[0]));
		}
	});
}

/* 
 * Get user information Based on theri Messenger page-scoped ID.
 * @param senderID - ID of the user.
 * @param callback - function to execute when complete.
 * Called everytime a user messages TritonFind.
 */
function getUserObj(senderID, callback) {
	
	//sqlString to execute
	var sqlStr = 'SELECT ' +
					'u.userKey, ' +
					'u.userID, ' +
					'u.state, ' +
					'u.workingItem, ' +
					'u.subscribed, ' +
					'u.lastMess, ' +
					'u.convo, ' +
					'COUNT(i.itemKey) AS numItems ' +
				'FROM users u ' +
				'LEFT JOIN items i ' +
					'ON (u.userKey = i.userKey)' +
				'WHERE userID=?';
	//Parameter array for sql String
	var paramArr = [senderID];
	
	//Execute String
	connectAndQuery(sqlStr, paramArr, function(err, result) {
		if(err) {
			callback(err);
		}
		else {
			//If user is not in database yet, upload them into it.
			if(  ! result[0].userKey ) {
				uploadUser(senderID, callback);

			}
			else {
				callback(null, new lib.UserObj(result[0]));
			}
		}
	});
}

/*
 * Get an item's information based on its hash value.
 * @param lookupHash - The salted/hashed value of the item code (barcode value).
 * @param callback - Function to invoke when complete.
 */
function getItem(lookupHash, callback) {
	
	//sqlString to invoke
	var sqlStr = 'SELECT * FROM items WHERE code = ?';
	//Paramter array to replace ?'s for sqlString
	var paramArr = [lookupHash];
	
	//Execute sqlString
	connectAndQuery(sqlStr, paramArr, function(err, data) {
		if(err) {
			callback(err);
		}
		else {
			//return first value (will be the only value in result)
			callback(err, data[0]);
		}
	});
}

/*
 * Get an item's information given it's itemKey.
 * @param itemKey - The item's key in the items table.
 * @param callback - Function to invoke when complete.
 */
function getItemKey(itemKey, callback) {
	
	//sqlString to execute
	var sqlStr = 'SELECT * FROM items WHERE itemKey = ?'
	//Paramter array for sqlString
	var paramArr = [itemKey];

	//Execute sqlString
	connectAndQuery(sqlStr, paramArr, function(err, data) {
		if(err) {
			callback(err);
		}
		else {
			//Send back first result (will be only result);
			callback(err, data[0]);
		}
	});
}

/*
 * Insert a new item into the items table.
 * @param itemCode - The hashed value of the decoded barcode.
 * @param userKey - Key for the user that owns the item.
 * @param callback - Function to invoke when complete.
 */
function insertNewItem(itemCode, userKey, callback) {
	
	//sqlString to execute
	var sqlStr = 'INSERT INTO items (code, userKey) VALUES (?,?)';
	//Paramter array for sqlString
	var paramArr = [itemCode.substring(0,255), userKey];
	
	//Execute sqlString
	connectAndQuery(sqlStr, paramArr, callback);
}

/* 
 * Update the state of a specified user.
 * @param userKey - Key of the user to update.
 * @param state - A 2 charater long string of a user's state
 * @param callback - function to invoke when complete.
 */
function updateState(userKey, state, callback) {
	
	//sqlString to execute
	var sqlStr = 'UPDATE users SET state = ? WHERE userKey = ?';
	//Paramter array for the sqlString
	var paramArr = [state, userKey];
	
	//Execute sqlString
	connectAndQuery(sqlStr, paramArr, callback);
}

/* 
 * Updates a user's working Item
 * @param userKey - Key of the user to update
 * @param itemKey - Key of the item that will become's the user's working item
 * @param callback - Function to invoke when complete.
 */
function updateWorkingItem(userKey, itemKey, callback) {
	
	//sqlString to execute
	var sqlStr = 'UPDATE users SET workingItem = ? WHERE userKey = ?';
	//Paramter array for the sqlString
	var paramArr = [itemKey, userKey];
	
	//Execute sqlString
	connectAndQuery(sqlStr, paramArr, callback);
}

/* 
 * Update a user's conversation partner.
 * @param userKey - Key of the user to update.
 * @param convoKey - Key of the other user that the current user is in a 
 	conversation with.
 * @param callback - function to invoke when complete.
 */
function updateConvo(userKey, convoKey, callback) {
	
	var sqlStr = 'UPDATE users SET convo = ? WHERE userKey=?';
	var paramArr = [userKey, convoKey];

	connectAndQuery(sqlStr, paramArr, callback);
}

/* 
 * Update both the state and convo partner of a user, duel-sql execution.
 * @param userKey - Key of the user to update
 * @param state  - State that will become the user's state
 * @param convoKey - userKey of the user's conversation partner
 * @param callback - function to invoke when complete
 */
function updateStateAndConvo(userKey, state, convoKey, callback) {
	updateState(userKey, state, function(err, data) {
		if(err) {
			callback(err);
		}
		else {
			updateConvo(userKey, convoKey, callback);
		}
	});
}

function updateStateAndWorkingItem(userKey, state, itemKey, callback) {
	updateState(userKey, state, function(err, data) {
		if(err) {
			callback(err);
		}
		else {
			updateWorkingItem(userKey, itemKey, function(err, data) {
				callback(err, data);
			});
		}
	
	});
}

function updateName(itemKey, newItemName, callback) {
	
	var sqlStr = 'UPDATE items SET name= ? WHERE itemKey = ?';
	var paramArr = [newItemName, itemKey];

	connectAndQuery(sqlStr, paramArr, function(err, data) {
		callback(err,data);
	});

}

function getAllItems(userKey, callback) {
	var sqlStr = 'SELECT * FROM items WHERE userKey = ?';
	var paramArr = [userKey];

	connectAndQuery(sqlStr, paramArr, callback);
}

function subscribeUser(userKey, callback) {
	var sqlStr = 'UPDATE users SET subscribed = 1 WHERE userKey = ?';
	var paramArr = [userKey];

	connectAndQuery(sqlStr, paramArr, callback);
}
function unsubscribeUser(userKey, callback) {
	var sqlStr = 'UPDATE users SET subscribed = null WHERE userKey = ?';
	var paramArr = [userKey];

	connectAndQuery(sqlStr, paramArr, callback);
}

function updateToConvo(userKey, otherUserKey, itemKey, callback) {
	var sqlStr = 'UPDATE users SET state = ?, convo = ?, workingItem = ? WHERE userKey  = ?';
	var paramArr = ['IC', otherUserKey, itemKey, userKey];
	
	connectAndQuery(sqlStr, paramArr, callback);

}

function endConvo(userObj, callback) {
	
	var sqlStr = 'UPDATE users ' +
				'SET ' +
					'convo = null, ' +
					'state = null, ' +
					'workingItem = null ' +
				'WHERE ' +
					'userKey = ? ' +
					'OR ' +
					'userKey = ?';
	var paramArr = [userObj.userKey, userObj.convo];

	connectAndQuery(sqlStr, paramArr, callback);
}

function fileReturn (convoID, userKey, itemKey, response, callback) {
	
	var sqlStr= 'INSERT INTO found ' + 
				'(foundKey, user1Key, user1Response, itemKey) ' +
				'VALUES (?,?,?,?) ' + 
				'ON DUPLICATE KEY UPDATE ' + 
					'user2Key = ?, user2Response = ?';
	var paramArr = [convoID, userKey, response, itemKey, userKey, response];

	connectAndQuery(sqlStr, paramArr, callback);

}

function makeReport(reporterKey, reporteeKey, timestamp, callback) {
	var sqlStr = 'INSERT INTO reports ' +
					'(reporter, reportee, timeFiled) ' +
					'VALUES (?,?,?)';
	var paramArr = [reporterKey, reporteeKey, timestamp];

	connectAndQuery(sqlStr, paramArr, callback);

}

function updateReport(reportKey, textMessage, callback) {
	var sqlStr = 'UPDATE reports SET message = ? WHERE reportKey = ?';
	var paramArr = [textMessage, reportKey];

	connectAndQuery(sqlStr, paramArr, callback);
}

function deleteItem(itemKey, callback) {
	var sqlStr = 'DELETE FROM items WHERE itemKey = ?';
	var paramArr = [itemKey];

	connectAndQuery(sqlStr, paramArr, callback);
}

function getSubbedUsers(callback) {
	
	var sqlStr = 'SELECT * FROM users WHERE subscribed = 1';
	var paramArr = [];

	connectAndQuery(sqlStr, paramArr, callback);

}

function getNumUsers(callback) {
	
	var sqlStr = 'SELECT COUNT(*) AS numUsers FROM users';

	connectAndQuery(sqlStr, [], callback);
}

function getNumItems(callback) {
	
	var sqlStr = 'SELECT COUNT(*) AS numItems FROM items';

	connectAndQuery(sqlStr, [], callback);
}

function getNumReturns(callback) {
	
	var sqlStr = 'SELECT COUNT(*) AS numReturns FROM found WHERE ' + 
					'NOT user1Response = 3 AND NOT user2Response = 3';
	
	connectAndQuery(sqlStr, [], callback);
}

function getMetrics(callback) {
	
	getNumUsers(function(err, numUsers) {
		
		if(err) {
			callback(err);
			return;
		}
		
		getNumItems(function(err2, numItems) {
			if(err2) {
				callback(err2);
				return;
			}

			getNumReturns(function(err3, numReturned) {
				if(err3) {
					callback(err3);
					return;
				}

				callback(null, numUsers[0], numItems[0], numReturned[0]);
			});
		});
	});
}
module.exports = {
	getUserObj					: getUserObj,
	getUserObjKey				: getUserObjKey,
	getItem 					: getItem,
	getItemKey					: getItemKey,
	insertNewItem				: insertNewItem,
	updateState					: updateState,
	updateWorkingItem			: updateWorkingItem,
	updateStateAndWorkingItem 	: updateStateAndWorkingItem,
	updateName					: updateName,
	updateStateAndConvo			: updateStateAndConvo,
	getAllItems					: getAllItems,
	subscribeUser				: subscribeUser,
	unsubscribeUser				: unsubscribeUser,
	endConvo					: endConvo,
	fileReturn					: fileReturn,
	updateToConvo				: updateToConvo,
	makeReport					: makeReport, 
	updateReport				: updateReport, 
	deleteItem					: deleteItem,
	getSubbedUsers				: getSubbedUsers,
	getMetrics					: getMetrics,
}
