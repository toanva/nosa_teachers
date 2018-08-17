var express = require('express');
var router = express.Router();
const { MessengerClient } = require('messaging-api-messenger');
var config = require('config');

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

//const client = MessengerClient.connect();
const client = MessengerClient.connect({
  accessToken: PAGE_ACCESS_TOKEN,
  version: '3.1',
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//server.get('/senddocument', (req, res, next) => {
//    res.sendFile('views/send.html', {
//        root: __dirname
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
			case 'giá xe':
				client.sendMessage(senderID, {  text: 'Hanoi (KV1) -> Noibai: 200k,Noibai -> Hanoi (KV1): 250k',});
				client.sendAttachment(senderID, {
				  type: 'image',
				  payload: {
					url: 'https://scontent.fhan3-2.fna.fbcdn.net/v/t1.0-9/31081528_568961726811775_3035050846015455232_n.jpg?_nc_cat=0&oh=275c0f15fc0d56e03fee30afc9bea818&oe=5C060612',
				  },
				});
				break;
			case 'liên hệ':
				client.sendMessage(senderID, {  text: 'MKmart hotline: 091.128.5465 / 1900545465!',});
				break;
			default:
                client.getUserProfile(senderID).then(user => {
                    var msg = 'Xin chào ' + user.last_name + ' ' + user.first_name + '. Mình là Thani - trợ lý ảo quản lý chương trình Viết về thầy cô giáo dục đặc biệt. Bạn muốn chia sẻ gì cùng mình nào?';
                    client.sendButtonTemplate(senderID, msg, [
                        {
                            type: 'web_url',
                            url: 'http://www.chiasecungthayco.com/2018/thong-tin-chuong-trinh',
                            title: 'Thông tin chương trình',
                            messenger_extensions: true,
                            webview_height_ratio: "tall"
                        },
                        {
                            type: 'web_url',
                            url: 'https://toanvachatbot.herokuapp.com/senddocument/',
                            title: 'Gửi bài viết',
                            messenger_extensions: true,
                            webview_height_ratio: "tall"
                        },
                        {
                            type: 'web_url',
                            url: 'https://toanvachatbot.herokuapp.com/document.html',
                            title: 'Bài viết chọn lọc'
                        },
                        {
                            type: 'web_url',
                            url: 'http://www.chiasecungthayco.com/2018',
                            title: 'Bình chọn',
                        },
                    ]);
                });
			    break;
		}
	}
};

module.exports = router;
