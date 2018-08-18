var express = require('express');
var router = express.Router();
const { MessengerClient } = require('messaging-api-messenger');
var config = require('config');
var objDb = require('./object/database.js');

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
	process.env.MESSENGER_APP_SECRET :
	config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
	(process.env.MESSENGER_VALIDATION_TOKEN) :
	config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
	(process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
    config.get('pageAccessToken');

const SERVER_URL = (process.env.SERVER_URL) ?
    (process.env.SERVER_URL) :
    config.get('serverURL');

//const client = MessengerClient.connect();
const client = MessengerClient.connect({
  accessToken: PAGE_ACCESS_TOKEN,
  version: '3.1',
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

server.get('/senddocument', (req, res, next) => {
    let referer = req.get('Referer');
    //console.log("register.bot 0",referer);
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            console.log("register.bot 1", referer);
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            console.log("register.bot 2", referer);
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        } else if (referer.indexOf('staticxx.facebook.com') >= 0) {
            console.log("register.bot 3", referer);
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://staticxx.facebook.com');
        }
        res.sendFile('views/senddocument.html', {
            root: __dirname
        });
    }
});
//server.get('/registerspostback.bot', authFace, (req, res) => {
//    let body = req.query;

//    //console.log("body : ",body);
//    //var dateBrithDay= body.txtBrithDay;
//    res.status(200).send('Please close this window to return to the conversation thread.');
//    var returnMessage = "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé: Bạn tên là " + body.txtFullName + ", sinh ngày : " + body.txtDay + "/" + body.txtMonth + "/" + body.txtYear + " . Hiện bạn đang giữ chức vụ " + body.cboPosition + ", địa chỉ : " + body.txtWards + " , quận / huyện " + body.txtDistricts + ", Tỉnh / TP " + body.txtProvincial + " . Số điện thoại của bạn là : " + body.txtPhone + " Chuẩn chưa nhỉ?";
//    //console.log(returnMessage);
//    var mydate = new Date(parseInt(body.txtYear), parseInt(body.txtMonth) - 1, parseInt(body.txtDay));
//    //console.log("Date", mydate);
//    req.session.psid = body.psid;
//    var inputDate = new Date(mydate.toISOString());
//    var objMember = {
//        "_id": body.psid,
//        "Name": body.txtFullName,
//        "Birthday": inputDate,
//        "Provincial": body.txtProvincial,
//        "District": body.txtDistricts,
//        "Position": body.cboPosition,
//        "Ward": body.txtWards,
//        "Phone": body.txtPhone,
//        "BlockStatus": "Active"
//    };
//    if (objMember.District == undefined)
//        objMember.District = 'NA';
//    if (objMember.Ward == undefined)
//        objMember.Ward = 'NA';
//    var query = {
//        "Name": objMember.Provincial
//    };
//    objDb.getConnection(function (client) {
//        objDb.findProvincial(query, client, function (results) {
//            if (results.length == 1) {
//                objMember.GeoCodeProvincial = results[0].GeoCode;
//            } else {
//                objMember.GeoCodeProvincial = 'NA';
//            }
//            objDb.insertMembers(objMember, client, function (err, results) {
//                //	   res.send(results);
//                //console.log(results);
//                if (err) {
//                    sendTextMessage(body.psid, 'Echo:' + err);
//                } else {
//                    client.close();
//                    sendBackRegister(body.psid, returnMessage);
//                }

//                //// enc insert member
//            });
//            ////  end  findProvincial
//        });
//        /// end con
//    });

//});

router.get('/webhook', function(req, res, next) {
 
	console.log("get facebook")
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VALIDATION_TOKEN) {
		console.log("Validating webhook facebook : ", req.query['first_name']);
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.log("Không xác nhận. Đảm bảo rằng token hợp lệ phù hợp.");
		res.sendStatus(403);
	}
	
});

router.post('/webhook', function(req, res, next) {
 
	var data = req.body;
	console.log("Res Post facebook");

	// Checks this is an event from a page subscription
	if (data.object === 'page') {

		// Iterates over each entry - there may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;
			if (pageEntry.messaging) {
				pageEntry.messaging.forEach(function (messagingEvent) {

					//console.log("face event", messagingEvent.postback.payload);
					if (messagingEvent.message) {
						//console.log("Res Post facebook 1");
						receivedMessage(messagingEvent);
					} else if (messagingEvent.delivery) {
						console.log("Res Post delivery");
						////receivedDeliveryConfirmation(messagingEvent);
					} else if (messagingEvent.postback && messagingEvent.postback.payload == 'getstarted') {
						//present user with some greeting or call to action
						
					} else if (messagingEvent.postback && messagingEvent.postback.payload == 'confirm') {
						//present user 'confirm':				
						//sendMessageConfimRegister(messagingEvent.sender.id);
					} else {
						console.log("Facebook Webhook received unknown messagingEvent: ", messagingEvent);
					}
					////// Cập nhật lại thời gian hết hạn của member để đếm số thành viên đang hoạt động với bót
				});
			} else {
				console.log("Messaging undefined");
			}
		});

		// Returns a '200 OK' response to all requests
		res.status(200).send('EVENT_RECEIVED');
	} else {
		// Returns a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}
});

function sendRegisterForm(recipientId, msg) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: msg,
                    buttons: [{
                        type: "web_url",
                        url: SERVER_URL + "/senddocument",
                        title: "Gửi bài viết",
                        messenger_extensions: true,
                        webview_height_ratio: "tall",
                        fallback_url: SERVER_URL + "/senddocument"
                    }]
                }
            }
        }
    };
    callSendAPI(messageData);
};

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v3.1/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;
                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                }
            } else {
                console.error(response.error);
            }
        });
};
function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;
	let response;
	console.log("Received message for user %d and page %d at %d with message:",
		senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));
	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;
	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;
	var msg = "x";

	if (isEcho) {
		// Just logging message echoes to console
		console.log("Received echo for message %s and app %d with metadata %s",
			messageId, appId, metadata);
		return;
	} else if (quickReply) {
		client.sendText(senderID, 'Hello! quickReply', { tag: 'ISSUE_RESOLUTION' });
	}else if (messageText) {
		switch (messageText.toLowerCase()) {
            case 'Thông tin chương trình':
				client.sendAttachment(senderID, {
				  type: 'image',
				  payload: {
					url: 'https://scontent.fhan3-2.fna.fbcdn.net/v/t1.0-9/31081528_568961726811775_3035050846015455232_n.jpg?_nc_cat=0&oh=275c0f15fc0d56e03fee30afc9bea818&oe=5C060612',
				  },
				});
				break;
            case 'Gửi bài viết':
                client.sendAttachment(senderID, {
                    type: 'image',
                    payload: {
                        url: 'https://scontent.fhan3-2.fna.fbcdn.net/v/t1.0-9/31081528_568961726811775_3035050846015455232_n.jpg?_nc_cat=0&oh=275c0f15fc0d56e03fee30afc9bea818&oe=5C060612',
                    },
                });
				break;
			default:
                client.getUserProfile(senderID).then(user => {
                    var msg = 'Xin chào ' + user.last_name + ' ' + user.first_name + '. Mình là Thani - trợ lý ảo quản lý chương trình Viết về thầy cô giáo dục đặc biệt. Bạn muốn chia sẻ gì cùng mình nào?';
                    client.sendButtonTemplate(senderID, msg, [
                        {
                            type: 'web_url',
                            url: 'http://www.chiasecungthayco.com/2018/thong-tin-chuong-trinh',
                            title: 'Thông tin chương trình'
                        },
                        {
                            type: 'web_url',
                            url: 'https://toanvachatbot.herokuapp.com/senddocument/',
                            title: 'Gửi bài viết'
                        },
                        //{
                        //    type: 'web_url',
                        //    url: 'https://toanvachatbot.herokuapp.com/document.html',
                        //    title: 'Bài viết chọn lọc'
                        //}
                        //,
                        {
                            type: 'web_url',
                            url: 'http://www.chiasecungthayco.com/2018',
                            title: 'Bình chọn'
                        }
                    ]);
                });
			    break;
		}
	}
};

module.exports = router;
