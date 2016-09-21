/* File Name: formatter-messenger.js
*  Author: Alex Garcia
*  Description: Formats different messages in order to be accepted by the 
				Mesenger Send API (wow I should rewrite this)
*  Edit Date: 9/18/16
*/

//Uses lib.js for some data
var lib = require('./lib.js');

function ReplyObjText(senderID, textMess, notifType) {

	this.recipient = {
		id: senderID
	}

	this.message = {
		text: textMess
	}

	if(!notifType)
		notifType = lib.NOTIF_TYPES.REG;
	
	this.notification_type = notifType;
}
function ReplyObjPicture(senderID, picURL) {
	
	this.recipient = {
		id: senderID
	}

	this.message = {
		attachment : {
		
			type	: 'image',
			payload : 	{
							url: picURL
						}
		}
	}
			
	
}
function Button(buttType, buttTitle, buttPayload, buttUrl){
	this.type = buttType;
	this.title = buttTitle;
	this.payload = buttPayload;
	this.url = buttUrl;
}
function GenericElement(elementTitle, imageURL, subTitle, buttonArr, itemURL){
	this.title = elementTitle;
	this.image_url = imageURL;
	this.subtitle = subTitle;
	this.item_url = itemURL;
	this.buttons = buttonArr;
}
function ReplyObjGeneric(senderID, elementArr){

	this.recipient = {
		id: senderID, 
	}

	this.message = {
		
		attachment : {
			type: 'template',
			payload: {
				template_type : 'generic',
				elements: elementArr
			}
		}
	}
}
function ReplyObjPicQuick(senderID, picURL, qrTitleArr, qrDataArr, qrTypeArr, notifType) {
	
	var work = new ReplyObjQuick(senderID, null, qrTitleArr, qrDataArr, qrTypeArr, notifType);

	work.message.attachment = {
		type: 'image',
		payload: {
			url: picURL
		}
	};

	return work;
}

function ReplyObjQuick(senderID, textMess, qrTitleArr, qrDataArr, qrTypeArr, notifType){
	
	function QuickReply(qrTitle, qrPayload, qrType){
		
		if(typeof qrType === 'undefined') qrType = 'text';

		this.title = qrTitle;
		this.payload = qrPayload;
		this.content_type = qrType;

	}
	
	var qrArr = [];
	var qr;

	for(var i = 0; i < qrTitleArr.length; i++){
		
		qr = new QuickReply(qrTitleArr[i], 
							qrDataArr[i], 
							(qrTypeArr && qrTypeArr[i]) ? qrTypeArr[i] : 'text');
		qrArr.push(qr);
	}
		
	this.recipient = {
		id: senderID
	}

	this.message = {
		text: textMess,
		quick_replies: qrArr
	}

	if(!notifType)
		notifType = lib.NOTIF_TYPES.REG;
	
	this.notification_type = notifType;


}

function ReplyObjButton(senderID, textMess, buttonsArr) {
	
	this.recipient = {
		id: senderID
	}

	this.message = {
		attachment: {
			type: 'template',
			payload : {
				template_type: 'button',
				text: textMess, 
				buttons: buttonsArr
			}
		}
	}
}
function ReplyObjSenderAction(senderID, action) {
	
	this.recipient = {
		id: senderID
	}

	this.sender_action = action;
}





module.exports = {
	
	ReplyObjText		: ReplyObjText,
	ReplyObjSenderAction: ReplyObjSenderAction,
	ReplyObjPicture 	: ReplyObjPicture,
	ReplyObjQuick 		: ReplyObjQuick,
	ReplyObjGeneric		: ReplyObjGeneric,
	Button				: Button,
	GenericElement		: GenericElement,
	ReplyObjButton		: ReplyObjButton,
	ReplyObjPicQuick	: ReplyObjPicQuick,

}
