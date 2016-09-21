/* File Name:  barcode.js
*  Author: Alex Garcia
*  Description: utilizes and scrapes zxing.org's online barcode decoding tool
*  Edit Date: 9/18/16
*/

"use strict";

//Uses the request library to access the zxing.org websute
var request = require('request');

//Uses cheerio to parse out zxing website result
var cheerio = require('cheerio');

//Base zxing.org url for decoding
var BASE_URL = 'http://zxing.org/w/decode?u=';


/*
 * Decode's a given imageURL's image for barcode.
 * @param imageURL - URL string of an image to decode.
 * @param callback - function to invoke when complete.
 */
 /*Returns an array of barcode results, since zxing can find multiple barcodes
   in one image. Example of what it can return:

   TODO

 */
function decode (imageURL, callback){
	
	//Request zxing URL that'l have decode results
	request(BASE_URL + encodeURIComponent(imageURL), function (err, resp, body) {
		
		if(err){
			console.log('Error in request: ' + err.message);
			callback(err);
			return;
		}
		else {

			//Will contain a singular decode result
			var result = {};
			//Cheerio var of the body of zxing decode
			var $ = cheerio.load(body);
			
			if (! ($('h1').text() === ' Decode Succeeded')){
				//Specific error message, meaning request was successful but
				//bad picture TODO make err object cleaner
				err = {num: 1};
				callback(err);
				return;
			}
			
			//Will contain an array of all barcode results, will be the return val
			var returnArray = [];
			
			//TODO make better var names
			//The type of data, used in parsing
			var dataType;

			//The data itself
			var data;

			//Iterate through each barcode result
			$('#result').each(function(resultsIndex, resultElem) {
			
			//Clear out result var, useful when 2+ barcode results
			result = {};
				

				//Iterate through each aspect of the decode result
				$(this).children().each(function(i, elem) {
					

					dataType = elem.children[0].children[0].data;
					
					//Ternary operator since HTML result table is weird
					data = (elem.children[1].children[0].children)
						? elem.children[1].children[0].children[0].data
						: elem.children[1].children[0].data;
					

					//Fill in result object
					if(dataType === 'Raw text'){
						result.raw_text = data;
					}
					else if (dataType === 'Raw bytes'){
						result.raw_bytes = data;
					}
					else if(dataType === 'Barcode format'){
						result.barcode_format = data;
					}
					else if(dataType === 'Parsed Result Type'){
						result.parsed_result_type = data;
					}
					else if (dataType === 'Parsed Result'){
						result.parsed_result = data;
					}

				});
				//Push current decode result ito return array. Then continue to 
				//next decode result
				returnArray.push(result);
			});

			//reached when complete.
			callback(null, returnArray);

		}
	});
}


module.exports = {
	decode : decode,
}
