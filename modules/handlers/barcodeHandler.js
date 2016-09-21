/* File Name: barcodeHandler.js
*  Author: Alex Garcia
*  Description: Handles when a barcode picture (or any picture) is received. 
				Processes it, determine how to reply.
*  Edit Date: 9/17/16
*/

barcode = require('../barcode.js');
var sql = require('../sql.js');
var lib = require('../lib.js');
var formatter = require('../formatter-messenger.js');
var crypto = require('crypto');

function handleBarcode(userObj, imageURL, callback) {
	var replyText;
	var ret = [];

	barcode.decode(imageURL, function(err, resultArray){
		if(err){
				//Connection was good, but no Barcode was found.
				if(err.num === 1){
					replyText = 'I\'m sorry, I couldn\'t find a barcode in ' +
									'that pic! Please try again, and make sure ' +
									'the following is true:\n' +
									'▪The picture is in portrait\n' +
									'▪There is a lot of light\n' +
									'▪The picture isn\'t blurry, all bars are clear\n' + 
									'▪The barcode is large';
							
					var replyText2 = 'Here is an example of a perfect photo to ' + 
										'scan:';
					var replyText3 = 'BTW, if you\'d rather type in the barcode code, click this ' + 
									'this button. Otherwise, retry sending me a picture!';
					var button = new formatter.Button('postback', 'Type It In!', 
									JSON.stringify({manualID:1}));

					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
					ret.push(new formatter.ReplyObjText(userObj.userID, replyText2));
					ret.push( new formatter.ReplyObjPicture(userObj.userID, 'https://asg017.github.io/Projects/TritonFind/pics/example-correct.png' ));
					ret.push(new formatter.ReplyObjButton(userObj.userID, replyText3, [button]));
					callback(ret);
					return;

				}

				//Conection error, API didn't work
				else {
					replyText = 'Whoo, I\'m sorry! I had a behind-the-scenes ' + 
									'problems, can you please try again?';

					ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
					callback(ret);
					return;
				}

		}

		//Barcode was found
		else {
			handleFound(userObj, resultArray, callback);
		}
	});
}

function handleNotDatabase(userObj, barcodeResult, lookupHash, callback) {
	var ret = [];
	var replyText;

	var yesPayload;
	var noPayload;

	var qrTitles;
	var qrData;
	
	if(barcodeResult.barcode_format !== 'CODABAR' || 
		barcodeResult.raw_text.substring(0, 5) !== '21822') {
		replyText = 'Are you trying to scan something that is NOT a UCSD ID?'
		yesPayload = JSON.stringify( {scanNonIDYes : { item_code : lookupHash } });
		noPayload = JSON.stringify( {scanNonIDNo: 1});
	}
	else {
		replyText = 'It does not seem like that item is registered with ' +
				'TrionFind! Would you like to register it as ' +
				'your own?';
		yesPayload = JSON.stringify( {registerYes : { item_code : lookupHash } });
		noPayload = JSON.stringify( {registerNo: 1});
	}

	qrTitles = [ 'Yes', 'No' ];
	qrData = [ yesPayload, noPayload ];

	ret.push( new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitles, qrData) );
	callback(ret);
}

function determineMostProbableBarcode(resultArray) {

	//TODO: Instead of guessing which one is right, prompt the user for each
	//possible result, have them choose.

	//Check to see if one of the decode results is UCSD ID-like, 21822 start and
	//CODABAR format
	for(var index = 0; index < resultArray.length; index++) {
		if(resultArray[index].raw_text.substring(0, 5) === '21822') {
			return resultArray[index];
		}
	}
	//If no UCSD ID-like decode results, assume it's not UCSD ID, return first 
	//non-CODABAR result
	for(var index = 0; index < resultArray.length; index++) {
		if(resultArray[index].barcode_format !== 'CODABAR') {
			return resultArray[index];
		}
	}
}
function handleFound(userObj, resultArray, callback) {
	var ret = [];
	var replyText;
	
	var finalResult = determineMostProbableBarcode(resultArray);

	var barcodeCode = finalResult.raw_text;
	var salt = process.env.SALT;

	var lookupHash = crypto.createHash(process.env.ENCRYPTION_TYPE).update(salt + barcodeCode, 'latin1').digest('hex');

	sql.getItem(lookupHash, function(err, itemObj){
		
		//sql error, our side
		if(err) {
			replyText = 'I\'m sorry! there were some behind-the-scenes errors ' + 
							'while processing that. Do you mind sending me ' + 
							'that barcode again?';
			ret.push(new formatter.ReplyObjText(userObj.userID, replyText));
			callback(ret);
		}
		else {
			
			//Item is not in database
			if(! itemObj ) {
				handleNotDatabase(userObj, finalResult, lookupHash, callback);
				return;
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
				var yesPayload = JSON.stringify( {connectYes : { ownerKey : itemObj.userKey, itemKey : itemObj.itemKey } } );
				var noPayload = JSON.stringify( {connectNo: 1});

				var qrTitlesArr = ['Yes', 'No'];
				var qrDataArr = [yesPayload, noPayload];

				ret.push( new formatter.ReplyObjQuick(userObj.userID, replyText, qrTitlesArr, qrDataArr) );
				callback(ret);
			}

		}
	});		
}
module.exports = {
	
	handleBarcode: handleBarcode,

}
