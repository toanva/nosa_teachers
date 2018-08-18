/* jshint node: true, devel: true */
// sử dụng strict mode của javascript

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
//const ZaloOA = require('zalo-sdk').ZaloOA;
const request = require('request');
const https = require('https');
const config = require('config');
const crypto = require('crypto'); // thư viện hỗ trợ mã hóa
var path = require('path');
var getDirName = require('path').dirname;
const MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb')
var util = require('util');
var formidable = require('formidable');
const multer = require('multer');
var cloudinary = require('cloudinary');
var objDb = require('./object/database.js');
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fieldSize: 2 * 1024 * 1024
	}
});
var fs = require('fs');
var FormData = require('form-data');
var t = require('./test.js');
var provincial = require('./Provincial.js');
////Toàn thêm
var Cryptojs = require("crypto-js"); //Toanva add
///// hết
//Toanva add api Message
const { MessengerClient } = require('messaging-api-messenger');


const server = express();

server.set('port', process.env.PORT || 8080);
server.set('view engine', 'ejs');
server.use(session({
	secret: 'nsvn119',
	saveUninitialized: true,
	resave: true
}));
server.use(bodyParser.urlencoded({
	extended: false,
	limit: '10mb',
	parameterLimit: 10000
}))
server.use(bodyParser.json({
	verify: verifyRequestSignature,
	limit: '10mb'
}));

server.use(express.static('public'));
// App Secret can be retrieved from the App Dashboard
const MONGO_URL = (process.env.MESSENGER_APP_SECRET) ?
	process.env.MESSENGER_APP_SECRET :
	config.get('mongoUrl');

const DATA_BASE_NAME = (process.env.MESSENGER_APP_SECRET) ?
	process.env.MESSENGER_APP_SECRET :
	config.get('databasename');

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

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
	(process.env.SERVER_URL) :
	config.get('serverURL');
const IMAGE_CLOUD_NAME = (process.env.SERVER_URL) ?
	(process.env.SERVER_URL) :
	config.get('image_cloud_name');
const IMAGE_API_KEY = (process.env.SERVER_URL) ?
	(process.env.SERVER_URL) :
	config.get('image_api_key');
const IMAGE_API_SECRET = (process.env.SERVER_URL) ?
	(process.env.SERVER_URL) :
	config.get('image_api_secret');
const client = MessengerClient.connect({
	accessToken: PAGE_ACCESS_TOKEN,
	appSecret: APP_SECRET,
	version: '3.1'
});
//var SERVER_URL ="https://nongsanvn.herokuapp.com";
if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
	console.error("Missing config values");
	process.exit(1);
}
cloudinary.config({
	cloud_name: IMAGE_CLOUD_NAME,
	api_key: IMAGE_API_KEY,
	api_secret: IMAGE_API_SECRET
});


////////////
/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */

function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];

	if (!signature) {
		// For testing, let's log an error. In production, you should throw an 
		// error.
		console.error("Couldn't validate the signature.");
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', APP_SECRET)
			.update(buf)
			.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
};

const saveLogs = function (objLogs) {
	try {
		objDb.getConnection(function (client) {
			objDb.insertLogs(objLogs, client, function (err, results) {

				if (err) {
					console.log("insertLogs err:", err);
				} else {
					console.log("insertLogs ss:", objLogs);
					//sendBackRegister(body.psid, returnMessage);
				}
				client.close();
			});
		});
	} catch (err) {
		console.error("saveLogs: ", err);
	}
};

/// Dùng cho messs
var authFace = function (req, res, next) {
	//console.log("Session :",req.session);
	console.log("Session faceUser :", req.session.faceUser);
	if (req.session && req.session.faceUser)
		return next();
	else
		return res.sendStatus(401);
};
/// Dùng cho CMS
var auth = function (req, res, next) {
	if (req.session && req.session.admin)
		return next();
	else
		return res.sendStatus(401);
};
////////
var authKsv = function (req, res, next) {
	if (req.session && req.session.ksv)
		return next();
	else
		return res.sendStatus(401);
};
////////// rowter
server.get('/setup', (req, res) => {
	setupGetStartedButton(res);
	//setupPersistentMenu(res);
	setupGreetingText(res);
});
server.post('/', function (req, res) {
});
//Toanva add getkeyCMS
server.post('/getkeyCMS', function (req, res) {
	let body = req.body;
	if (req.session.cms_key == undefined || req.session.cms_key == null || req.session.cms_key !== req.sessionID) {
		var cms_key = req.sessionID;
		req.session.cms_key = cms_key;
		res.send(cms_key);
	} else {
		res.send(req.session.cms_key);
	}
});
//Toanva add loginCMS
server.post('/loginCMS', function (req, res) {
	try {

		let body = req.body;
		var bytes = Cryptojs.AES.decrypt(body.data, req.sessionID);
		var stringByte = bytes.toString(Cryptojs.enc.Utf8);
		console.log("loginCMS Byte to string:", stringByte);
		if (stringByte != undefined && stringByte != null && stringByte != "") {
			var decryptedData = JSON.parse(bytes.toString(Cryptojs.enc.Utf8));

			if (!decryptedData.UserName || !decryptedData.Password) {
				console.log("loginCMS failed");
				res.send('Mật khẩu hoạc tài khoản không đúng');
			} else {
				console.log("loginCMS:", decryptedData.UserName);
				var query = {
					UserName: decryptedData.UserName,
					Password: Cryptojs.MD5(decryptedData.Password).toString()
				}
				objDb.getConnection(function (client) {
					objDb.findUsers(query, client, function (results) {
						client.close();
						if (results !== null && results.length > 0) {
							console.log("loginCMS success");
							req.session.user = body.UserName;
							req.session.admin = true;
							req.session.faceUser = true;
							res.json({
								success: "true",
								message: 'Đăng nhập thành công'
							});
						} else {
							console.log("loginCMS failed");
							res.json({
								success: "false",
								message: 'Mật khẩu hoạc tài khoản không đúng'
							});
						}
					});
				});
			}
		} else {
			console.error("loginCMS failed byte string nulll");
			res.json({
				success: "false",
				message: 'Phiên làm việc không còn hiệu lực, bạn tải lại trang để đăng nhập'
			});
		}
	} catch (err) {
		console.error("loginCMS failed:", err);
		res.json({
			success: "false",
			message: 'Phiên làm việc không còn hiệu lực, bạn tải lại trang để đăng nhập'
		});
	}
});
server.get('/logoutCMS', function (req, res) {
	req.session.destroy();
	res.send("logout success!");
});
// Toanva login - End
server.post('/login.bot', function (req, res) {
	let body = req.body;
	console.log("login.bot:", body);
	if (!body.UserName || !body.Password) {
		console.log("login failed");
		res.send('Mật khẩu hoạc tài khoản không đúng.');
	} else if (body.UserName == "test" && body.Password == "12345") {
		req.session.user = body.UserName;
		req.session.admin = true;
		req.session.faceUser = true;
		console.log("login success");
		res.send("true");

	} else if (body.UserName == "ksv" && body.Password == "ksvnosa") {
		req.session.user = body.UserName;
		req.session.ksv = true;
		res.send("true");

	} else {
		console.log("login failed");
		res.send('Mật khẩu hoạc tài khoản không đúng.!');
	}
});
server.get('/logout.bot', function (req, res) {
	req.session.destroy();
	res.send("logout success!");
});
server.get('/getMemberOnline', (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	try {
		var cDate = new Date();
		var eDate = new Date();
		eDate.setMinutes(cDate.getMinutes() + 15);

		var query = {
			ExpiredDate: {
				$gte: cDate,
				$lte: eDate
			}
		};
		console.log("getMemberOnline query : ", query);
		objDb.getConnection(function (client) {
			objDb.findMemberOnline(query, client, function (results) {
				client.close();
				res.send(results);
			});
		});
	} catch (err) {
		console.error("getMemberOnline:", err);
		res.send(null);
	}
});
server.get('/getMemberConnect', (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	try {
		var query = {};
		console.log("getMemberConnect query : ", query);
		objDb.getConnection(function (client) {
			objDb.findMemberOnline(query, client, function (results) {
				client.close();
				res.send(results);

			});
		});
	} catch (err) {
		console.error("getMemberConnect:", err);
		res.send(null);
	}
});
server.get('/getGroupProduct', authFace, (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	console.log("getGroupProduct");
	objDb.getConnection(function (client) {
		objDb.findGroupProductByGeoCode(client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/getTopProduct', authFace, (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	var top = req.query.Top;
	var query = {};
	if (top == undefined)
		top = 10;
	//console.log("Top Product query", query);
	objDb.getConnection(function (client) {
		objDb.findTopProduct(query, Number(top), client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/test', (req, res) => {

	var query;
	callGetLocation(req.query.adrr,  function (results) {
		//console.log("test");
		//console.log("test status:",results.status);
		console.log("test:",results.results[0].geometry.location);
		//client.close();
		res.send(results);

	});
	
	//res.send(req.query.idProvincial);
});
//Toanva add getProductCMS
server.get('/getProductCMS', auth, (req, res) => {
	var name = req.query.name;
	var provincial = req.query.provincial;
	var districts = req.query.districts;
	var wards = req.query.wards;
	var query = {};
	if (name != "") {
		name = ".*" + name + ".*";
		Object.assign(query, {
			Name: {
				$regex: name
			}
		});
	}
	if (provincial != "") {
		Object.assign(query, {
			Provincial: provincial
		});
	}
	if (districts != "") {
		Object.assign(query, {
			District: districts
		});
	}
	if (wards != "") {
		Object.assign(query, {
			Ward: wards
		});
	}
	console.log("Product query CMS", query);
	objDb.getConnection(function (client) {
		objDb.findProduct(query, client, function (results) {
			client.close();
			res.send(results);
		});
	});
});


server.get('/getProduct', (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	var name = req.query.name;
	var id = req.query.id;
	var provincial = req.query.provincial;
	var districts = req.query.districts;
	var wards = req.query.wards;
	var position = req.query.position;
	var type = req.query.type;
	var minprice = req.query.minprice;
	var maxprice = req.query.maxprice;
	var minvolume = req.query.minvolume;
	var maxvolume = req.query.maxvolume;
	//var reqQuery=  req.query.strQuery
	var query = {};
	if (name != "" && name != undefined) {
		//{ "Name": {'$regex': '.*nam.*'}}
		name = ".*" + name + ".*";
		Object.assign(query, {
			Name: {
				$regex: name
			}
		});
	}
	if (id != "" && id != undefined) {
		Object.assign(query, {
			_id: new mongodb.ObjectID(id)
		});
	}
	if (provincial != "" && provincial != undefined) {
		Object.assign(query, {
			Provincial: provincial
		});
	}
	if (districts != "" && districts != undefined) {
		Object.assign(query, {
			District: districts
		});
	}
	if (wards != "" && wards != undefined) {
		Object.assign(query, {
			Ward: wards
		});
	}
	if (type != "" && type != undefined) {
		Object.assign(query, {
			Type: type
		});
	}
	
	var where="";
	if (minprice != "" && minprice != undefined) {
		where=where+" parseInt(this.Price) >= "+minprice + " &&";	
	}
	if (maxprice != "" && type != maxprice) {
		
		where=where+" parseInt(this.Price) <= "+maxprice + " &&";
	}	
	if (minvolume != "" && minvolume != undefined) {
		
		where=where+" parseInt(this.Quantity) >= "+minvolume + " &&";		
	}
	if (maxvolume != "" && type != maxvolume) {
		
		where=where+" parseInt(this.Quantity) <= "+maxvolume + " &&";
	}
	where=where+" 1==1";
	Object.assign(query, {
			$where: where
		});

	console.log("Product query", query);
	objDb.getConnection(function (client) {
		objDb.findProduct(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/getPosition', (req, res) => {
	var query = {};
	objDb.getConnection(function (client) {
		objDb.findPosition(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/getProvincial', (req, res) => {
	var query = {};
	objDb.getConnection(function (client) {
		objDb.findProvincial(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/getProvincialTemp', (req, res) => {
	var query = {};
	objDb.getConnection(function (client) {
		objDb.findProvincialTemp(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/getDistrict', (req, res) => {
	var query
	if (req.query.idProvincial == 'ALL') {
		query = {};

	} else {
		query = {
			"IdProvince": req.query.idProvincial
		};
	}
	objDb.getConnection(function (client) {
		objDb.findDistrict(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
	//res.send(req.query.idProvincial);
});
server.get('/getWards', (req, res) => {

	var query;
	if (req.query.idDistrict == 'ALL') {
		query = {};

	} else {
		query = {
			"IdDistrict": req.query.idDistrict
		};
	}
	objDb.getConnection(function (client) {
		objDb.findWards(query, client, function (results) {
			console.log("getWards");
			client.close();
			res.send(results);

		});
	});
	//res.send(req.query.idProvincial);
});
server.get('/getBranch', (req, res) => {
	var query;
	if (req.query.idWards == 'ALL') {
		query = {};

	} else {
		query = {
			"IdWards": req.query.idWards
		};
	}
	console.log("getBranch query:", query);
	objDb.getConnection(function (client) {
		objDb.findBranch(query, client, function (results) {
			console.log("getBranch");
			client.close();
			res.send(results);

		});
	});
	//res.send(req.query.idProvincial);
});
//Toanva router USERS
server.get('/getUser', auth, (req, res) => {
	var username = req.query.username;
	var fullname = req.query.fullname;
	var status = req.query.status;
	console.log("getUser username: ", username);
	if (username == null || username == 'all')
		username = "";
	if (fullname == null || fullname == 'all')
		fullname = "";
	if (status == null || status == 'all')
		status = "";
	var query = {};
	if (username) {
		username = ".*" + username + ".*";
		Object.assign(query, {
			UserName: {
				$regex: username
			}
		});
	}
	if (fullname) {
		fullname = ".*" + fullname + ".*";
		Object.assign(query, {
			FullName: {
				$regex: fullname
			}
		});
	}
	if (status) {
		Object.assign(query, {
			Status: {
				$regex: status
			}
		});
	}
	console.log("getUser query", query);
	objDb.getConnection(function (client) {
		objDb.findUsers(query, client, function (results) {
			client.close();
			res.send(results);
		});
	});
});
server.post('/insertUser', (req, res) => {
	let body = req.body;
	var isEdit = body.isEdit;
	var username = body.UserName;
	var fullname = body.FullName;
	var password = Cryptojs.MD5(body.Password).toString();
	var status = body.Status;
	var objUser = {
		Status: status,
		UserName: username,
		FullName: fullname,
		Password: password
	}
	objDb.getConnection(function (client) {
		if (isEdit == 0) {
			console.log("insertUser username: ", username);
			//Insert
			objDb.insertUsers(objUser, client, function (err, results) {
				if (err) {
					console.log("insertUser Err", err);
					res.json({
						success: "false",
						message: err
					});
				} else {
					res.json({
						success: "true"
					});
					console.log("insertUser SS");
				}
				console.log("insertUser: Close Connction")
				client.close();
			});
		} else {
			console.log("editUser username: ", username);
			//Update
			objDb.editUsers(objUser, client, function (err, results) {
				if (err) {
					console.log("editUser Err", err);
					res.json({
						success: "false",
						message: err
					});
				} else {
					res.json({
						success: "true",
						message: "Sửa thông tin tài khoản thành công"
					});
					console.log("editUser SS");
				}
				console.log("editUser: Close Connction")
				client.close();
			});
		}
	});
});
server.post('/deleteUser', (req, res) => {
	let body = req.body;
	console.log('deleteUser: ', body);
	mess = {};
	if (body.UserName) {
		objDb.getConnection(function (client) {
			objDb.deleteUser(body.UserName, client, function (err, results) {
				if (err) {
					res.json({
						success: "false",
						message: err
					});
					console.log("deleteUser Err", err);
				} else {
					res.json({
						success: "true",
						message: "Xóa thành công"
					});
					console.log("deleteUser SS");
					client.close();
				}

			});
		});
	} else {
		res.json({
			success: "false",
			message: "Cần bổ sung thông tin user"
		});
		console.log("deleteUser err Thieu thong tin user");
	}
});
//Toanva end

server.get('/ipg.bot', (req, res, next) => {
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
		//res.render('register');
		req.session.faceUser = true;
		res.sendFile('views/ipg.html', {
			root: __dirname
		});
	}
});
server.get('/iproducts.bot', (req, res, next) => {
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
		//res.render('register');
		req.session.faceUser = true;
		console.log("Session iproducts:",req.session);
		res.sendFile('views/iproducts.html', {
			root: __dirname
		});
	}
});
server.get('/iproductspostback.bot', authFace, (req, res) => {
	//res.setHeader('Content-Type', 'application/json');
	let body = req.query;
	var mydate = new Date();
	var inputDate = new Date(mydate.toISOString());
	var imgName = body.psid + inputDate;
	req.session.psid = body.psid;



	//console.log("body : ",body);	
	res.status(200).send('Please close this window to return to the conversation thread.');
	console.log(body.cboProvincial);
	var returnMessage = "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé: sản phẩm tên là " + body.txtName + ", sản lượng dữ kiến : " + body.txtQuantity + " , giá bán dự kiến : " + body.txtPrice + " , số diện tích canh tác : " + body.txtAcreage + ", hợp tác xã " + body.cboIsCooperative + ". Chuẩn chưa nhỉ?";
	console.log(returnMessage);

	//	    findMembers(query, client, function (results) {
	//			res.send(results);
	//			client.close();
	//		});
	//console.log("Date", inputDate);
	var query = {
		_id: body.psid
	};
	var provincial = "NA";
	var district = "NA";
	var Ward = "NA";
	var postName = " ";
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {
				provincial = results[0].Provincial;
				district = results[0].District;
				ward = results[0].Ward;
				postName = results[0].Name;
			}
			var objProduct = {
				"IdPost": body.psid,
				"Name": body.txtName,
				"Quantity": body.txtQuantity,
				"Price": body.txtPrice,
				"Acreage": body.txtAcreage,
				"Cooperative": body.cboIsCooperative,
				"ImageData": imgName,
				"InsertDate": inputDate,
				"Provincial": provincial,
				"District": district,
				"Ward": ward,
				"PostName": postName
			};
			objDb.insertProduct(objProduct, client, function (err, results) {
				//	   res.send(results);
				//console.log(results);
				if (err) {
					sendTextMessage(body.psid, 'Echo:' + err);
				} else {
					console.log("insertProduct:", results.ops[0]._id);
					sendBackProduct(body.psid, returnMessage);
				}
				client.close();
			});

		});
	});

});
server.post('/iproductspostback.bot', upload.single('somefile'), (req, res) => {

	try {
		let body = req.body;
		var mydate = new Date();
		var inputDate = new Date(mydate.toISOString());
		var imgName = body.psid + mydate.getFullYear() + mydate.getMonth() + mydate.getDate() + mydate.getHours() + mydate.getMinutes() + mydate.getSeconds() + body.ImgName;
		var dir = "./public/uploads";

         
		//console.log("test:",body.ImgName);

		var returnMessage;
		//console.log(returnMessage);
		var imgUrl = imgName;
		console.log("test1:", body.IsImage);
		
		if (body.IsImage == '1') {
			//console.log("test1:",body.ImgName);
			imgUrl = "https://res.cloudinary.com/nosavn-net/image/upload/v1531382251/NSVN.jpg";
			var query = {
				_id: body.psid
			};
			var provincial = "NA";
			var district = "NA";
			var Ward = "NA";
			var postName = " ";
			var geoCodeProvincial = "NA";
			objDb.getConnection(function (client) {
				objDb.findMembers(query, client, function (results) {
					var adrr="";
					if (results.length == 1) {
						provincial = results[0].Provincial;
						district = results[0].District;
						ward = results[0].Ward;
						if(ward!='' && ward!='NA' && ward!=undefined)
						{
							adrr=adrr+ward;
						}
						if(district!='' && district!='NA' && district!=undefined)
						{
							adrr=adrr+","+district;
						}
						if(provincial!='' && provincial!='NA' && provincial!=undefined)
						{
							adrr=adrr+","+provincial+",Việt Nam";
						}
						
						postName = results[0].Name;
						geoCodeProvincial = results[0].GeoCodeProvincial;
					};
					returnMessage = " Sản phẩm tên là " + body.Name + ", sản lượng dữ kiến : " + body.Quantity + " " + body.QuantityUnit + " , giá bán dự kiến : " + body.Price + " " + body.PriceUnit + "  , số diện tích canh tác : " + body.Acreage + " " + body.AcreageUnit + " và thời vụ từ tháng " + body.ToMonth + " đến tháng " + body.FromMonth + ", hợp tác xã " + body.IsCooperative + ", thông tin thêm về sản phẩm: " + body.Description + " . Chuẩn chưa nhỉ?";
					//callGetLocation(adrr,  function (lrs) {
							var objProduct = {
								"IdPost": body.psid,
								"Type": body.Type,
								"Name": body.Name,
								"Quantity": Number(body.Quantity),
								"QuantityUnit": body.QuantityUnit,
								"Price": Number(body.Price),
								"PriceUnit": body.PriceUnit,
								"Acreage": body.Acreage,
								"AcreageUnit": body.AcreageUnit,
								"Cooperative": body.IsCooperative,
								"ToMonth": body.ToMonth,
								"FromMonth": body.FromMonth,
								"ImageData": "",
								"ImgUrl": imgUrl,
								"InsertDate": inputDate,
								"Provincial": provincial,
								"District": district,
								"Ward": ward,
								"PostName": postName,
								"Description": body.Description,
								"Lati": results[0].Lati,
								"Long": results[0].Long,
								"GeoCodeProvincial": geoCodeProvincial
							};
				
						objDb.insertProduct(objProduct, client, function (err, results) {
							//	   res.send(results);
							//console.log(results);
							if (err) {
								sendTextMessage(body.psid, 'Echo:' + err);
							} else {
								console.log("insertProduct : ", returnMessage);

								sendTextMessage(body.psid, "Cảm ơn " + postName + " đã cung cấp thông tin. Nosa kiểm tra lại nhé : Ảnh của sản phẩm ");
								sendUrlMessage(body.psid, "image", imgUrl, function (error, response, bd) {
									if (error) throw error;
									console.log("sendUrlMessage:");
									sendOneQuick(body.psid, returnMessage, "Chuẩn", "cfp", "OkLike.png");
									// sendBackProduct(body.psid, returnMessage);
								});
								client.close();
							}

							res.status(200).send('Please close this window to return to the conversation thread.');
						});
					//});
				/// end find member		
				});
			});
		} else {
			//console.log("test2:",body.DataImg);
			writeFileProduct(imgName, body.DataImg, dir, body.psid, function (err, results) {
				if (results) {
					//console.log("Cloudinary :",results);
					imgUrl = results.secure_url;
					var query = {
						_id: body.psid
					};
					var provincial = "NA";
					var district = "NA";
					var Ward = "NA";
					var postName = " ";
					var geoCodeProvincial = "NA";
					objDb.getConnection(function (client) {
						objDb.findMembers(query, client, function (results) {
							var adrr="";
							if (results.length == 1) {
								provincial = results[0].Provincial;
								district = results[0].District;
								ward = results[0].Ward;
								if(ward!='' && ward!='NA' && ward!=undefined)
								{
									adrr=adrr+ward;
								}
								if(district!='' && district!='NA' && district!=undefined)
								{
									adrr=adrr+","+district;
								}
								if(provincial!='' && provincial!='NA' && provincial!=undefined)
								{
									adrr=adrr+","+provincial+",Việt Nam";
								}

								postName = results[0].Name;
								geoCodeProvincial = results[0].GeoCodeProvincial;
							};
							returnMessage = " Sản phẩm tên là " + body.Name + ", sản lượng dữ kiến : " + body.Quantity + " " + body.QuantityUnit + " , giá bán dự kiến : " + body.Price + " " + body.PriceUnit + "  , số diện tích canh tác : " + body.Acreage + " " + body.AcreageUnit + " và thời vụ từ tháng " + body.ToMonth + " đến tháng " + body.FromMonth + ", hợp tác xã " + body.IsCooperative + ", thông tin thêm về sản phẩm: " + body.Description + " . Chuẩn chưa nhỉ?";
						///	callGetLocation(adrr,  function (lrs) {
								var objProduct = {
									"IdPost": body.psid,
									"Type": body.Type,
									"Name": body.Name,
									"Quantity": body.Quantity,
									"QuantityUnit": body.QuantityUnit,
									"Price": body.Price,
									"PriceUnit": body.PriceUnit,
									"Acreage": body.Acreage,
									"AcreageUnit": body.AcreageUnit,
									"Cooperative": body.IsCooperative,
									"ToMonth": body.ToMonth,
									"FromMonth": body.FromMonth,
									"ImageData": imgName,
									"ImgUrl": imgUrl,
									"InsertDate": inputDate,
									"Provincial": provincial,
									"District": district,
									"Ward": ward,
									"PostName": postName,
									"Description": body.Description,
									"Lati": results[0].Lati,
									"Long": results[0].Long,
									"GeoCodeProvincial": geoCodeProvincial
								};
								objDb.insertProduct(objProduct, client, function (err, results) {
									//	   res.send(results);
									//console.log(results);
									if (err) {
										sendTextMessage(body.psid, 'Echo:' + err);
									} else {
										console.log("insertProduct : ", returnMessage);

										sendTextMessage(body.psid, "Cảm ơn " + postName + " đã cung cấp thông tin. Nosa kiểm tra lại nhé : Ảnh của sản phẩm ");
										sendUrlMessage(body.psid, "image", imgUrl, function (error, response, bd) {
											if (error) throw error;
											console.log("sendUrlMessage:");
											sendOneQuick(body.psid, returnMessage, "Chuẩn", "cfp", "OkLike.png");
											// sendBackProduct(body.psid, returnMessage);
										});
										client.close();
									}

									res.status(200).send('Please close this window to return to the conversation thread.');
								});
							//});
						});/// end find member
					});
				}
			});


		}
	} catch (err) {
		console.error("iproductspostback:", err);
		res.status(200).send(err);
	}

});
server.get('/register.bot', (req, res, next) => {
	
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
		req.session.faceUser = true;
		console.log("Session register:",req.session);
		//res.render('register');
		res.sendFile('views/register.html', {
			root: __dirname
		});
	}
});
server.get('/basicregister.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//console.log("Session register:",req.session);
		//res.render('register');
		res.sendFile('views/basicregister.html', {
			root: __dirname
		});
	}
});
server.get('/registertemp.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/registerTemp.html', {
			root: __dirname
		});
	}
});
server.get('/rgg.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/rgg.html', {
			root: __dirname
		});
	}
});
server.post('/basicregisterspostback.bot', upload.single('somefile'), authFace, (req, res) => {

	try {
		let body = req.body;
		var dir = "./public/uploads/Avatar";
		req.session.psid = body.psid;

		//var level = 9999;
		var msgConcurrently = '';
		//if(Number(body.Level)>=5)
		//{
		var mydate = new Date();
		var inputDate = new Date(mydate.toISOString());
		console.log("basicregisterspostback PSID", body.psid);
		var returnMessage = "Bạn tên là " + body.Name + ", sinh ngày : " + body.Birthday + " , địa chỉ : " + body.Wards + " , quận / huyện " + body.Districts + ", Tỉnh / TP " + body.Provincial + " . Số điện thoại của bạn là : " + body.Phone + ", Email " + body.Email + ". Chuẩn chưa nhỉ?";
		console.log(returnMessage);
		var imgUrl;
		callGetProfile(body.psid, function (objFacebook) {

			var objFacebook = JSON.parse(objFacebook);
			console.log("callGetProfile: ", objFacebook);
			imgUrl = objFacebook.profile_pic;
			var objMember = {
				"_id": body.psid,
				"Name": body.Name,
				"Birthday": body.Birthday,
				"Position": 'Khác',
				"IsConcurrently": '',
				"Concurrently": '',
				"Provincial": body.Provincial,
				"District": body.Districts,
				"IdDistrict": body.IdDistrict,
				"Ward": body.Wards,
				"IdWard": body.IdWard,
				"Branch": body.Branch,
				"Phone": body.Phone,
				"Email": body.Email,
				"ImgUrl": imgUrl,
				"LevelName": 'Khác',
				"Level": 8,
				"Layer": 9,
				"Delegate": Number(0),
				"DelegateId": null,
				"DelegateName": null,
				"DelegateLevelName": null,
				"DelegateImgUrl": null,
				"ApprovedId": null,
				"ApprovedName": null,
				"BlockStatus": "PENDING",
				"InsertDate": inputDate
			};
			if (objMember.Provincial == undefined)
				objMember.Provincial = 'NA';
			if (objMember.District == undefined)
				objMember.District = 'NA';
			if (objMember.Ward == undefined)
				objMember.Ward = 'NA';
			if (objMember.Branch == undefined)
				objMember.Branch = 'NA';

			var query = {
				"Name": objMember.Provincial
			};

			objDb.getConnection(function (client) {
				objDb.findProvincial(query, client, function (results) {
					if (results.length == 1) {
						objMember.GeoCodeProvincial = results[0].GeoCode;
					} else {
						objMember.GeoCodeProvincial = 'VN-HN';
					}
					objDb.insertMembers(objMember, client, function (err, results) {
						//	   res.send(results);
						//console.log(results);
						if (err) {
							//client.close();
							sendTextMessage(body.psid, 'Echo:' + err);
						} else {

							console.log("basicregisterspostback: ", objMember);
							//writeFile(imgName,body.DataImgAvatar,dir,body.psid);
							sendTextMessage(body.psid, "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé. Dưới đây là ảnh đại diện Facebook của bạn :");
							sendUrlMessage(body.psid, "image", imgUrl, function (error, response, bd) {
								if (error) throw error;
								console.log("sendUrlMessage:");
								sendBasicBackRegister(body.psid, returnMessage);

							});

							client.close();
							res.status(200).send('Please close this window to return to the conversation thread.');
							//res.send(objMember);
						}

						//// enc insert member
					});
					////  end  findProvincial
				});
				/// end con
			});


		});
	} catch (err) {
		console.error("basicregisterspostback:", err);
		res.send(null);
	}
});
server.post('/registerspostback.bot', upload.single('somefile'), authFace, (req, res) => {

	try {
		let body = req.body;
		var dir = "./public/uploads/Avatar";
		req.session.psid = body.psid;
		var mydate = new Date();
		var inputDate = new Date(mydate.toISOString());
		//var dateBrithDay = new Date(body.Birthday).toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'});
		//var  = new Date();
		//var mydate = new Date(body.Birthday);
		//var dateBrithDay = new Date(mydate.toISOString());
		//console.log("body : ", dateBrithDay);
		//imgName=body.psid+body.ImgName;

		//res.status(200).send('Please close this window to return to the conversation thread.');
		//console.log(body.cboProvincial);
		if (body.Level == '1') {
			body.Provincial = 'Hà Nội';
			body.Districts = 'Hoàn Kiếm';
			body.Wards = 'Trần Hưng Đạo';
			body.Branch = "NA";

		};
		var level = 9999;
		var msgConcurrently = '';
		//if(Number(body.Level)>=5)
		//{
		if (body.IsConcurrently == 'Là cán bộ Đoàn kiêm nhiệm' && body.Concurrently != '') {
			msgConcurrently = ', cũng là cán bộ Đoàn kiêm nhiệm có chức danh khác là : ' + body.Concurrently;

		} else if (body.IsConcurrently == 'Là cán bộ Đoàn viên') {
			msgConcurrently = ' vừa là cán bộ Đoàn viên';
		}
		//}		
		console.log("registerspostback PSID", body.psid);
		var returnMessage = "Bạn tên là " + body.Name + ", sinh ngày : " + body.Birthday + " . là cán bộ " + body.LevelName + " đang giữ chức vụ " + body.Position + msgConcurrently + ", địa chỉ : chi hội " + body.Branch + ", " + body.Wards + " , quận / huyện " + body.Districts + ", Tỉnh / TP " + body.Provincial + " . Số điện thoại của bạn là : " + body.Phone + ", Email " + body.Email + ". Chuẩn chưa nhỉ?";
		console.log(returnMessage);
		//var mydate = new Date(parseInt(body.Year), parseInt(body.Month) - 1, parseInt(body.Day));
		var imgUrl;

		//writeFile(imgName,body.DataImgAvatar,dir,body.psid,function (err, results) {
		//	   res.send(results);
		//console.log(results);
		//if (results) {
		//imgUrl=results.secure_url;
		callGetProfile(body.psid, function (objFacebook) {

			var objFacebook = JSON.parse(objFacebook);
			console.log("callGetProfile: ", objFacebook);
			imgUrl = objFacebook.profile_pic;
			var objMember = {
				"_id": body.psid,
				"Name": body.Name,
				"Birthday": body.Birthday,
				"Position": body.Position,
				"IsConcurrently": body.IsConcurrently,
				"Concurrently": body.Concurrently,
				"IdProvincial": body.IdProvincial,
				"Provincial": body.Provincial,
				"District": body.Districts,
				"IdDistrict": body.IdDistrict,
				"Ward": body.Wards,
				"IdWard": body.IdWard,
				"Branch": body.Branch,
				"Phone": body.Phone,
				"Email": body.Email,
				"ImgUrl": imgUrl,
				"LevelName": body.LevelName,
				"Level": Number(body.Level),
				"Layer": Number(body.Layer),
				"Delegate": Number(0),
				"DelegateId": null,
				"DelegateName": null,
				"DelegateLevelName": null,
				"DelegateImgUrl": null,
				"ApprovedId": null,
				"ApprovedName": null,
				"BlockStatus": "PENDING",
				"InsertDate": inputDate
			};
			if (objMember.Provincial == undefined)
				objMember.Provincial = 'NA';
			if (objMember.District == undefined)
				objMember.District = 'NA';
			if (objMember.Ward == undefined)
				objMember.Ward = 'NA';
			if (objMember.Branch == undefined)
				objMember.Branch = 'NA';

			var query = {
				"Name": objMember.Provincial
			};

			objDb.getConnection(function (client) {
				objDb.findProvincial(query, client, function (results) {
					if (results.length == 1) {
						objMember.GeoCodeProvincial = results[0].GeoCode;
					} else {
						objMember.GeoCodeProvincial = 'VN-HN';
					}
					
					/// add Lati and Long
					if(objMember.Level>3 && objMember.IdWard!=null && objMember.IdWard!='NA' && objMember.IdWard!=undefined){
						
						var qr1={_id:objMember.IdWard}
						objDb.findWards(qr1, client, function (rsWard) {							
							objMember.Lati=rsWard[0].Lati;
							objMember.Long=rsWard[0].Long;
							insertMember(body.psid,imgUrl,objMember,returnMessage,client,res);
						});
					 
					}else if(objMember.Level>3 && (objMember.IdWard==null || objMember.IdWard=='NA' || objMember.IdWard=='9999')){
						
						var qr1={_id:objMember.IdDistrict}
						objDb.findDistrict(qr1, client, function (rsDistrict) {							
							objMember.Lati=rsDistrict[0].Lati;
							objMember.Long=rsDistrict[0].Long;
							insertMember(body.psid,imgUrl,objMember,returnMessage,client,res);
						});
					 
					}
					else if(objMember.Level==3  && objMember.IdDistrict!=null && objMember.IdDistrict!='NA' && objMember.IdDistrict!=undefined){
						var qr1={_id:objMember.IdDistrict}
						objDb.findDistrict(qr1, client, function (rsDistrict) {							
							objMember.Lati=rsDistrict[0].Lati;
							objMember.Long=rsDistrict[0].Long;
							insertMember(body.psid,imgUrl,objMember,returnMessage,client,res);
						});
						
					}else if(objMember.Level==3  && (objMember.IdDistrict==null || objMember.IdDistrict=='NA' || objMember.IdDistrict=='9999')){						
						objMember.Lati=results[0].Lati;
						objMember.Long=results[0].Long;
						insertMember(body.psid,imgUrl,objMember,returnMessage,client,res);
						
					}else{
						objMember.Lati=results[0].Lati;
						objMember.Long=results[0].Long;
						insertMember(body.psid,imgUrl,objMember,returnMessage,client,res);
					}
			
					
					
					
					////  end  findProvincial
				});
				/// end con
			});


		});
	} catch (err) {
		console.error("registerspostback:", err);
		res.send(null);
	}
});
server.post('/registerspostbacktemp.bot', upload.single('somefile'), authFace, (req, res) => {
	//let body = req.query;
	let body = req.body;
	var dir = "./public/uploads/Avatar";
	//	console.log("Test:",req.files.path);
	//console.log("body : ",body);
	var dateBrithDay = new Date(body.Birthday);
	console.log("body : ", dateBrithDay);
	//imgName=body.psid+body.ImgName;

	//res.status(200).send('Please close this window to return to the conversation thread.');
	//console.log(body.cboProvincial);
	if (body.Level == '1') {
		body.Provincial = 'Hà Nội';
		body.Districts = 'Hoàn Kiếm';
		body.Wards = 'Trần Hưng Đạo';
		body.Branch = "NA";

	};
	var level = 9999;
	console.log("registerspostback PSID", body.psid);
	var returnMessage = "Bạn tên là " + body.Name + ", sinh ngày : " + dateBrithDay.getDate() + "/" + (dateBrithDay.getMonth() + 1) + "/" + dateBrithDay.getFullYear() + " . là cán bộ " + body.LevelName + " đang giữ chức vụ " + body.Position + ", địa chỉ : chi hội " + body.Branch + ", " + body.Wards + " , quận / huyện " + body.Districts + ", Tỉnh / TP " + body.Provincial + " . Số điện thoại của bạn là : " + body.Phone + ", Email " + body.Email + ". Chuẩn chưa nhỉ?";
	console.log(returnMessage);
	//var mydate = new Date(parseInt(body.Year), parseInt(body.Month) - 1, parseInt(body.Day));
	var imgUrl;
	req.session.psid = body.psid;
	//writeFile(imgName,body.DataImgAvatar,dir,body.psid,function (err, results) {
	//	   res.send(results);
	//console.log(results);
	//if (results) {
	//imgUrl=results.secure_url;
	callGetProfile(body.psid, function (objFacebook) {

		var objFacebook = JSON.parse(objFacebook);
		console.log("callGetProfile: ", objFacebook);
		imgUrl = objFacebook.profile_pic;
		var objMember = {
			"_id": body.psid,
			"Name": body.Name,
			"Birthday": body.Birthday,
			"Position": body.Position,
			"IsConcurrently": body.IsConcurrently,
			"Concurrently": body.Concurrently,
			"Provincial": body.Provincial,
			"District": body.Districts,
			"Ward": body.Wards,
			"Branch": body.Branch,
			"Phone": body.Phone,
			"Email": body.Email,
			"ImgUrl": imgUrl,
			"LevelName": body.LevelName,
			"Level": Number(body.Level),
			"Layer": Number(body.Layer),
			"Delegate": Number(0),
			"DelegateId": null,
			"DelegateName": null,
			"DelegateLevelName": null,
			"DelegateImgUrl": null,
			"BlockStatus": "PENDING"
		};
		if (objMember.Provincial == undefined)
			objMember.Provincial = 'NA';
		if (objMember.District == undefined)
			objMember.District = 'NA';
		if (objMember.Ward == undefined)
			objMember.Ward = 'NA';
		if (objMember.Branch == undefined)
			objMember.Branch = 'NA';

		var query = {
			"Name": objMember.Provincial
		};
		objDb.getConnection(function (client) {
			objDb.findProvincial(query, client, function (results) {
				if (results.length == 1) {
					objMember.GeoCodeProvincial = results[0].GeoCode;
				} else {
					objMember.GeoCodeProvincial = 'VN-HN';
				}
				objDb.insertMembersTemp(objMember, client, function (err, results) {
					//	   res.send(results);
					//console.log(results);
					if (err) {
						//client.close();
						sendTextMessage(body.psid, 'Echo:' + err);
					} else {

						console.log("registerspostbackTemp: ", objMember);
						//writeFile(imgName,body.DataImgAvatar,dir,body.psid);
						sendTextMessage(body.psid, "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé. Dưới đây là ảnh đại diện Facebook của bạn :");
						sendUrlMessage(body.psid, "image", imgUrl, function (error, response, bd) {
							if (error) throw error;
							console.log("sendUrlMessage:");
							client.close();
							sendBackRegisterTemp(body.psid, returnMessage);

						});


						res.status(200).send('Please close this window to return to the conversation thread.');
						//res.send(objMember);
					}

					//// enc insert member
				});
				////  end  findProvincial
			});
			/// end con
		});
	});

});
server.get('/registerspostback.bot', authFace, (req, res) => {
	let body = req.query;

	//console.log("body : ",body);
	//var dateBrithDay= body.txtBrithDay;
	res.status(200).send('Please close this window to return to the conversation thread.');
	var level = 9999;
	if (body.cboPosition == 'CB TƯ Hội LHTN Việt Nam' || body.cboPosition == 'CB TƯ Đoàn TNCS HCM') {
		level = 1;

	} else if (body.cboPosition == 'TV Ban thư ký HLHTN Tỉnh' || body.cboPosition == 'TV Ban CM Tỉnh/Thành Đoàn' || body.cboPosition == 'CB khác thuộc Tỉnh/Thành Đoàn') {
		level = 2;

	} else if (body.cboPosition == 'BT Quận/Huyện Đoàn' || body.cboPosition == 'CTH LHTN Quận/Huyện' || body.cboPosition == 'PCTH LHTN Quận/Huyện' || body.cboPosition == 'Ủy viên HLHTN Quận/Huyện') {
		level = 3;

	} else if (body.cboPosition == 'PBT Đoàn Xã/Phường/Thị Trấn' || body.cboPosition == 'CTH LHTN Xã/Phường/Thị Trấn' || body.cboPosition == 'PCTH LHTN Xã/Phường/Thị Trấn') {
		level = 4;
	} else {
		level = 5;
	}




	var returnMessage = "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé: Bạn tên là " + body.txtFullName + ", sinh ngày : " + body.txtDay + "/" + body.txtMonth + "/" + body.txtYear + " . Hiện bạn đang giữ chức vụ " + body.cboPosition + ", địa chỉ : " + body.txtWards + " , quận / huyện " + body.txtDistricts + ", Tỉnh / TP " + body.txtProvincial + " . Số điện thoại của bạn là : " + body.txtPhone + " Chuẩn chưa nhỉ?";
	//console.log(returnMessage);
	var mydate = new Date(parseInt(body.txtYear), parseInt(body.txtMonth) - 1, parseInt(body.txtDay));
	//console.log("Date", mydate);
	req.session.psid = body.psid;
	var inputDate = new Date(mydate.toISOString());
	var objMember = {
		"_id": body.psid,
		"Name": body.txtFullName,
		"Birthday": inputDate,
		"Provincial": body.txtProvincial,
		"District": body.txtDistricts,
		"Position": body.cboPosition,
		"Ward": body.txtWards,
		"Phone": body.txtPhone,
		"BlockStatus": "Active"
	};
	if (objMember.District == undefined)
		objMember.District = 'NA';
	if (objMember.Ward == undefined)
		objMember.Ward = 'NA';
	var query = {
		"Name": objMember.Provincial
	};
	objDb.getConnection(function (client) {
		objDb.findProvincial(query, client, function (results) {
			if (results.length == 1) {
				objMember.GeoCodeProvincial = results[0].GeoCode;
			} else {
				objMember.GeoCodeProvincial = 'NA';
			}
			objDb.insertMembers(objMember, client, function (err, results) {
				//	   res.send(results);
				//console.log(results);
				if (err) {
					sendTextMessage(body.psid, 'Echo:' + err);
				} else {
					client.close();
					sendBackRegister(body.psid, returnMessage);
				}

				//// enc insert member
			});
			////  end  findProvincial
		});
		/// end con
	});

});
server.get('/botksv.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/botksv.html', {
			root: __dirname
		});
	}
});
server.get('/botnoksv.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/botnoksv.html', {
			root: __dirname
		});
	}
});
server.get('/uqksv.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/uqksv.html', {
			root: __dirname
		});
	}
});
server.get('/ksv.bot', (req, res, next) => {
	res.sendFile('views/ksv.html', {
		root: __dirname
	});
});
server.get('/ksvd.bot', (req, res, next) => {
	res.sendFile('views/ksvd.html', {
		root: __dirname
	});
});
server.get('/rg.bot', (req, res, next) => {
	res.sendFile('views/rg.html', {
		root: __dirname
	});
});
server.post('/rgpostback.bot', upload.single('somefile'), (req, res) => {

	let body = req.body;
	var returnMessage = "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé: Bạn tên là " + body.Name + ", sinh ngày : " + body.Birthday + " . Hiện bạn đang giữ chức vụ " + body.Position + ", địa chỉ : " + body.Wards + " , quận / huyện " + body.Districts + ", Tỉnh / TP " + body.Provincial + " các chi hội :" + body.Branch + ". Số điện thoại của bạn là : " + body.Phone + " Chuẩn chưa nhỉ?";
	console.log(returnMessage);
	//var mydate = new Date(parseInt(body.txtYear), parseInt(body.txtMonth) - 1, parseInt(body.txtDay));
	//console.log("Date", mydate);
	//req.session.psid = body.psid;
	//	var inputDate = new Date(mydate.toISOString());
	if (body.Name != undefined) {

		var objBranch;
		if (body.Branch != undefined && body.Branch != 'NA' && body.Branch != '') {
			var arr = body.Branch.split(',');
			objBranch = arr;
			console.log(arr);
			//var objBranch[arr.length];
			for (var i = 0; i < arr.length; i++) {
				obj = {
					"IdWards": body.IdWards,
					"Name": arr[i].toString()
				};
				objBranch[i] = obj;
			}
		} else {
			objBranch = undefined;
		};

		if (body.Position != 'CTH LHTN xã')
			objBranch = "NA";
		if (body.Position == 'CTH LHTN Tỉnh') {
			objBranch = undefined;
			body.Districts = 'NA';
			body.Wards = 'NA';
		};
		if (body.Position == 'CTH LHTN huyện') {
			objBranch = undefined;
			body.Wards = 'NA';
		};

		var objMember = {
			"Name": body.Name,
			"Birthday": body.Birthday,
			"Position": body.Position,
			"Provincial": body.Provincial,
			"Districts": body.Districts,
			"Wards": body.Wards,
			"Branch": objBranch,
			"Phone": body.Phone,
			"Email": body.Email,
			"BlockStatus": "PENDING"
		};
		console.log("objMember:", objMember);
		var query = {
			"Name": objMember.Provincial
		};
		objDb.getConnection(function (client) {
			objDb.findProvincial(query, client, function (results) {
				if (results.length == 1) {
					objMember.GeoCodeProvincial = results[0].GeoCode;
				} else {
					objMember.GeoCodeProvincial = 'NA';
				}
				objDb.insertKycMembers(objMember, client, function (err, results) {
					//	   res.send(results);
					//console.log(results);
					if (err) {
						//sendTextMessage(body.psid, 'Echo:' + err);
						client.close();
						res.send(err);
					} else {

						if (objBranch && objBranch != undefined && objBranch != "NA") {
							objDb.insertBranch(objBranch, client, function (err, results) {
								if (err) {
									//sendTextMessage(body.psid, 'Echo:' + err);
									//client.close();
									res.send(err);
								} else {
									client.close();
									res.send(returnMessage);
								}
							});
						} else {
							client.close();
							res.send(returnMessage);
						}
						///sendBackRegister(body.psid, returnMessage);
					}
					client.close();
					//// enc insert member
				});
				////  end  findProvincial
			});
			/// end con
		});
	}
});
server.post('/updateStatusKycMember.bot', authKsv, (req, res) => {

	let body = req.body;
	var returnMessage = "";
	console.log(body.BlockStatus);
	if (body.BlockStatus == 'ACTIVE')
		returnMessage = "Bạn đã duyệt thành công hội viên có số ĐT: " + body.Phone;
	else
		returnMessage = "Bạn đã từ chối phê duyệt thành công hội viên có số ĐT: " + body.Phone;



	objDb.getConnection(function (client) {
		objDb.updateStatusKycMembers(body.Phone, body.BlockStatus, client, function (err, results) {

			if (err) {
				//sendTextMessage(body.psid, 'Echo:' + err);
				console.log("updateStatusKycMember ERR:", err);
				//client.close();
				res.send(err);
			} else {
				console.log("updateStatusKycMember:", returnMessage);
				client.close();
				res.send(returnMessage);
			}

			////  end  findProvincial
		});

		/// end con
	});

});
server.post('/updateStatusMember.bot', authFace, (req, res) => {

	try {
		let body = req.body;
		var returnMessage = "";
		//console.log(body.BlockStatus);
		console.log(body.ApprovedId);
		if (body.BlockStatus == 'ACTIVE')
			returnMessage = "Bạn đã duyệt thành công hội viên có số ĐT: " + body.Phone;
		else
			returnMessage = "Bạn đã từ chối phê duyệt thành công hội viên có số ĐT: " + body.Phone;

		var query = {
			_id: body.ApprovedId
		};
		var query2 = {
			_id: body.psid
		};
		objDb.getConnection(function (client) {
			objDb.findMembers(query, client, function (results) {
				if (results.length > 0) {
					objDb.findMembers(query2, client, function (results2) {
						console.log("Check : " + results[0].Level + " " + results2[0].Level + " " + results[0].Layer + " " + results2[0].Layer);
						if (results[0].Level == results2[0].Level && results[0].Layer == results2[0].Layer && results[0].Level == 1) {
							console.log("updateStatusMember: Cùng layer không thể phê duyệt cho nhau");
							res.send("Thông báo : Thành viên này bạn không có quyền phê duyệt");
						} else {
							objDb.updateStatusMembers(body.psid, body.BlockStatus, body.ApprovedId, results[0].Name, client, function (err, rs) {

								if (err) {
									//sendTextMessage(body.psid, 'Echo:' + err);
									console.log("updateStatusMember ERR:", err);
									//client.close();
									res.send(err);
								} else {
									console.log("updateStatusMember:", returnMessage);
									if (body.BlockStatus == 'ACTIVE') {
										///// kiểm tra xem thành viên vừa được phê duyệt có quyền ksv không

										if (results2[0].Level == results2[0].Layer) {
											console.log("Check 2: " + results2[0].Level + " " + results2[0].Layer);
											msg = "Chúc mừng " + body.Name + " đã được xác thực tài khoản, ngay từ bây giờ bạn đã có thể sử dụng tính năng KSV rồi đấy. Bạn có muốn sử dụng tính năng KSV ngay không ?";
											quickReplies = [{
												content_type: "text",
												title: "Có",
												payload: "ksvyes",
												image_url: SERVER_URL + "/img/OkLike.png"
											}];
											sendQuickMessage(body.psid, msg, quickReplies);
											client.close();
											res.send(returnMessage);
										} else {
											console.log("Check 3: " + results2[0].Level + " " + results2[0].Layer);
											msg = body.Name + " đã được xác thực tài khoản. Bạn có muốn tiếp tục trò chuyện với Nosa không ?";
											quickReplies = [{
												content_type: "text",
												title: "Có",
												payload: "confirm",
												image_url: SERVER_URL + "/img/OkLike.png"
											}, {
												content_type: "text",
												title: "Hỗ trợ",
												payload: "help",
												image_url: SERVER_URL + "/img/helps.png"
											},{
												content_type: "text",
												title: "Hướng dẫn",
												payload: "guide",
												image_url: SERVER_URL + "/img/guide.png"
											}];
											sendQuickMessage(body.psid, msg, quickReplies);
											client.close();
											res.send(returnMessage);
										}
									} else {
										msg = body.Name + " không được xác thực tài khoản, bạn vui lòng liên hệ cán bộ hội cấp trên để biết thêm chi tiết nhé. Bạn có muốn tiếp tục nói chuyện với Nosa không ?";
										quickReplies = [{
											content_type: "text",
											title: "Có",
											payload: "confirm",
											image_url: SERVER_URL + "/img/OkLike.png"
										}, {
											content_type: "text",
											title: "Hỗ trợ",
											payload: "help",
											image_url: SERVER_URL + "/img/helps.png"
										},{
											content_type: "text",
											title: "Hướng dẫn",
											payload: "guide",
											image_url: SERVER_URL + "/img/guide.png"
										}];
										sendQuickMessage(body.psid, msg, quickReplies);
										client.close();
										res.send(returnMessage);
									}
								}
							});
						}
					})
				} else {
					console.log("updateStatusMember: Không tìm thấy người đang phê duyệt trong hệ thống");
					res.send("Lỗi : Không tìm thấy người đang thực hiện phê duyệt trong hệ thống");
				}
			});
			/// end con
		});
	} catch (err) {
		console.error("updateStatusMember:", err);
		res.send(null);
	}
});
server.post('/cancelStatusMember.bot', authFace, (req, res) => {

	let body = req.body;
	var returnMessage = "";
	//console.log(body.BlockStatus);
	console.log(body.ApprovedId);
	//if(body.BlockStatus=='ACTIVE')
	//	returnMessage = "Bạn đã duyệt thành công hội viên có số ĐT: "+body.Phone;
	// else
	returnMessage = "Bạn hủy xác thực của hội viên có số ĐT: " + body.Phone;

	var query = {
		_id: body.ApprovedId
	};
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				objDb.cancelStatusMembers(body.psid, "PENDING", body.ApprovedId, results[0].Name, client, function (err, rs) {

					if (err) {
						//sendTextMessage(body.psid, 'Echo:' + err);
						console.log("cancelStatusMembers ERR:", err);
						//client.close();
						res.send(err);
					} else {
						console.log("cancelStatusMembers:", returnMessage);
						if (body.BlockStatus == 'PENDING') {
							msg = "Xin chào " + body.Name + " đã bị hủy bỏ xác thực bởi " + results[0].Name + " . Bạn có muốn tiếp tục trò chuyện với Nosa không ?";
							quickReplies = [{
								content_type: "text",
								title: "Có",
								payload: "confirm",
								image_url: SERVER_URL + "/img/OkLike.png"
							}, {
								content_type: "text",
								title: "Hỗ trợ",
								payload: "help",
								image_url: SERVER_URL + "/img/helps.png"
							},{
								content_type: "text",
								title: "Hướng dẫn",
								payload: "guide",
								image_url: SERVER_URL + "/img/guide.png"
							}];
							sendQuickMessage(body.psid, msg, quickReplies);
							client.close();
							res.send(returnMessage);
						}
					}
				});
			} else {
				console.log("updateStatusMember: Không tìm thấy người đang phê duyệt trong hệ thống");
				res.send("Lỗi : Không tìm thấy người đang thực hiện phê duyệt trong hệ thống");
			}
		});
		/// end con
	});

});
server.post('/accpetDelegateMember.bot', authFace, (req, res) => {

	let body = req.body;
	var returnMessage = "";
	//console.log(body.BlockStatus);
	console.log(body.ApprovedId);
	//if(body.BlockStatus=='ACTIVE')
	returnMessage = "Bạn đã uỷ quyền thành công hội viên có số ĐT: " + body.Phone;
	//  else
	///	returnMessage = "Bạn đã từ chối phê duyệt thành công hội viên có số ĐT: "+body.Phone;

	var query = {
		_id: body.ApprovedId
	};
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				objDb.updateDelegateMembers(body.psid, 1, body.ApprovedId, results[0].Name, results[0].LevelName, results[0].ImgUrl, client, function (err, rs) {

					if (err) {
						//sendTextMessage(body.psid, 'Echo:' + err);
						console.log("accpetDelegateMember ERR:", err);
						//client.close();
						res.send(err);
					} else {
						console.log("accpetDelegateMember:", returnMessage);
						msg = "Chúc mừng " + body.Name + " đã được uỷ quyền sử dụng KSV, ngay từ bây giờ bạn đã có thể sử dụng tính năng KSV rồi đấy. Bạn có muốn sử dụng tính năng KSV ngay không ?";
						quickReplies = [{
							content_type: "text",
							title: "Có",
							payload: "ksvyes",
							image_url: SERVER_URL + "/img/OkLike.png"
						}];
						sendQuickMessage(body.psid, msg, quickReplies);
						client.close();
						res.send(returnMessage);
					}
				});
			} else {
				console.log("accpetDelegateMember: Không tìm thấy người đang phê duyệt trong hệ thống");
				res.send("Lỗi : Không tìm thấy người đang thực hiện uỷ quyền trong hệ thống");
			}
		});
		/// end con
	});

});
server.post('/cancelDelegateMember.bot', authFace, (req, res) => {

	let body = req.body;
	var returnMessage = "";
	//console.log(body.BlockStatus);
	console.log(body.ApprovedId);
	//if(body.BlockStatus=='ACTIVE')
	returnMessage = "Bạn đã bị huỷ uỷ quyền thành công hội viên có số ĐT: " + body.Phone;
	//  else
	///	returnMessage = "Bạn đã từ chối phê duyệt thành công hội viên có số ĐT: "+body.Phone;

	var query = {
		_id: body.ApprovedId
	};
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				objDb.updateDelegateMembers(body.psid, 0, body.ApprovedId, results[0].Name, results[0].LevelName, results[0].ImgUrl, client, function (err, rs) {

					if (err) {
						//sendTextMessage(body.psid, 'Echo:' + err);
						console.log("cancelDelegateMember ERR:", err);
						//client.close();
						res.send(err);
					} else {
						msg = "Xin chào " + body.Name + " đã bị hủy bỏ uỷ quyền bởi " + results[0].Name + " . Bạn có muốn tiếp tục trò chuyện với Nosa không ?";
						quickReplies = [{
							content_type: "text",
							title: "Có",
							payload: "confirm",
							image_url: SERVER_URL + "/img/OkLike.png"
						}, {
							content_type: "text",
							title: "Hỗ trợ",
							payload: "help",
							image_url: SERVER_URL + "/img/helps.png"
						},{
							content_type: "text",
							title: "Hướng dẫn",
							payload: "guide",
							image_url: SERVER_URL + "/img/guide.png"
						}];
						sendQuickMessage(body.psid, msg, quickReplies);
						client.close();
						res.send(returnMessage);

					}
				});
			} else {
				console.log("cancelDelegateMember: Không tìm thấy người đang phê duyệt trong hệ thống");
				res.send("Lỗi : Không tìm thấy người đang thực hiện uỷ quyền trong hệ thống");
			}
		});
		/// end con
	});

});
///Lấy thông tin ID từ điểm danh về và tạo webView điểm danh
server.get('/checkin.bot', (req, res) => {

	var fromId = req.param('fromid');
	var data = req.param('data');
	//var geo = req.param('geo'); 
	console.log("Get Id From : ", fromId);
	res.render('index');
	//res.send('Get Id From : '+ fromId + " = "+ data);
});

server.get('/closeForm', (req, res) => {

	var psid = req.query.psid;
	//var name = req.query.Name;
	var msg = "Bạn có muốn tiếp tục nói chuyện với Nosa không ?";
	quickReplies = [{
		content_type: "text",
		title: "Có chứ",
		payload: "confirm",
		image_url: SERVER_URL + "/img/OkLike.png"
	}, {
		content_type: "text",
		title: "Hỗ trợ",
		payload: "help",
		image_url: SERVER_URL + "/img/helps.png"
	},{
		content_type: "text",
		title: "Hướng dẫn",
		payload: "guide",
		image_url: SERVER_URL + "/img/guide.png"
	}];
	sendQuickMessage(psid, msg, quickReplies);
	res.send("Is Close");
	//res.send('Get Id From : '+ fromId + " = "+ data);
});

server.get('/webhook', function (req, res) {
	console.log("get facebook")
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VALIDATION_TOKEN) {
		console.log("Validating webhook facebook : ", req.query['first_name']);
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.log("Không xác nhận. Đảm bảo rằng token hợp lệ phù hợp.");
		res.sendStatus(403);
	}
});
server.post('/webhook', (req, res) => {
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

						callGetProfile(messagingEvent.sender.id, function (profile) {
							//console.log("Res Post facebook 3", profile);
							var obj = JSON.parse(profile);
							var msg = "Chúc mừng " + obj["last_name"] + " " + obj["first_name"] + " đã kết nối vào hệ thống!";
							//sendTextMessage(messagingEvent.sender.id, msg)

							sendMessageWelecome(messagingEvent.sender.id, msg);
						});
					} else if (messagingEvent.postback && messagingEvent.postback.payload == 'confirm') {
						//present user 'confirm':				
						sendMessageConfimRegister(messagingEvent.sender.id);

					} else {
						console.log("Facebook Webhook received unknown messagingEvent: ", messagingEvent);
					}
					////// Cập nhật lại thời gian hết hạn của member để đếm số thành viên đang hoạt động với bót
					try {
					 objDb.getConnection(function (client) {
						 objDb.insertMembersActive(messagingEvent.sender.id, client, function (results) {
								client.close();
							});
						});
					} catch (err) {
						console.error("insertMembersActive: ", err);
					}

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
server.post('/sendbroadcast.bot', auth, (req, res) => {
	let body = req.body;


	var msg = body.Msg;
	//console.log("strQuestion: ",strQuestion);	
	var query = {};
	var mess = {};
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			//	   res.send(results);
			//console.log(results);
			console.log('Total Broadcast send: ', results.length);
			client.close();
			for (var i = 0; i < results.length; i++) {
				sendTextMessage(results[i]._id, msg)
			}
			mess.ss = "Gửi thành công " + results.length + " tin";
		});
	});
	res.send(mess);

});
server.get('/getMemberByGroup', auth, (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	var code = req.query.code;
	var options = {};
	var pipeline = [];
	if (code == "BlockStatus") {
		pipeline = [{
			"$group": {
				"_id": {
					"BlockStatus": "$BlockStatus"
				},
				"COUNT(_id)": {
					"$sum": 1
				}
			}
		}, {
			"$project": {
				"_id": 0,
				"Total": "$COUNT(_id)",
				"BlockStatus": "$_id.BlockStatus"
			}
		}];

	} else if (code == "GeoCode") {
		pipeline = [{
			"$group": {
				"_id": {
					"Provincial": "$Provincial",
					"GeoCodeProvincial": "$GeoCodeProvincial"
				},
				"COUNT(_id)": {
					"$sum": 1
				}
			}
		}, {
			"$project": {
				"_id": 0,
				"Total": "$COUNT(_id)",
				"Provincial": "$_id.Provincial",
				"GeoCodeProvincial": "$_id.GeoCodeProvincial"
			}
		}];

	} else if (code == "Position") {
		pipeline = [{
			"$group": {
				"_id": {
					"Position": "$Position"
				},
				"COUNT(_id)": {
					"$sum": 1
				}
			}
		}, {
			"$project": {
				"_id": 0,
				"Total": "$COUNT(_id)",
				"Position": "$_id.Position"
			}
		}];
	}
	console.log("getMemberByGroup", code);
	objDb.getConnection(function (client) {
		objDb.findMembersByGroup(pipeline, options, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.get('/getListMemberApprovedById', authFace, (req, res) => {

	var psid = req.query.psid;
	console.log("getListMemberApprovedById psid: ", psid);

	var query = {
		_id: psid
	};
	console.log("getListMemberApprovedById query: ", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				results = results[0];
				var queryDetail = {};
				///// layerDelegatelayer- Delegate , được ủy quyền để tăng 1 cấp layer
				var layerDelegate = Number(results.Layer) - Number(results.Delegate);
				if (layerDelegate < 0) {
					layerDelegate = 0; // chỉ cho Ủy quyền đến cấp admin
				}
				console.log("getListMemberApprovedById layerDelegate: ", layerDelegate);
				if (results.BlockStatus == "ACTIVE") {

					Object.assign(queryDetail, {
						BlockStatus: 'ACTIVE'
					});
					Object.assign(queryDetail, {
						ApprovedId: psid
					});
					console.log("getListMemberApprovedById query detail", queryDetail);
					objDb.findMembers(queryDetail, client, function (resultsList) {
						client.close();
						res.send(resultsList);
					});
				} else {
					//client.close();
					res.send(null);
				}


			} else {
				client.close();
				res.send(results);
			}
		});
	});
});
server.get('/getListMemberById', authFace, (req, res) => {
	var psid = req.query.psid;
	console.log("getListMemberById psid: ", psid);

	var query = {
		_id: psid
	};
	console.log("getListMemberById query: ", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				results = results[0];
				var queryDetail = {};
				///// layerDelegatelayer- Delegate , được ủy quyền để tăng 1 cấp layer
				if (results.Delegate == null) {
					results.Delegate = 0;
				}
				var layerDelegate = Number(results.Layer) - Number(results.Delegate);
				if (layerDelegate < 0) {
					layerDelegate = 0; // chỉ cho Ủy quyền đến cấp admin
				}
				console.log("getListMemberById layerDelegate: ", layerDelegate);
				if (results.BlockStatus == "ACTIVE" && layerDelegate == results.Level) {
					console.log("getListMemberById Level : ", results.Level);
					///// layer = layerDelegate+1 để thấy dưới 1 cấp
					var layer = layerDelegate + 1;

					if (results.Level == 1 || results.Level == 0) {
						results.Provincial = "";
						results.District = "";
						results.Ward = "";

					}
					
					
					
					if (results.Level == 1) {
						////// Lấy cả layer = 1 và layer =2
						Object.assign(queryDetail, {
							$or: [{
								Layer: 2
							}, {
								Layer: 1
							}]
						});
					} else {
						/// Lấy leyer dưới 1 cấp
						if (results.Layer != undefined && results.Layer != "" && layer != 1 && layer != 0) {
							Object.assign(queryDetail, {
								Layer: Number(layer)
							});
						}
					}
					
					
					if (layer != 1 && layer != 0) {
						if (results.Provincial != undefined && results.Provincial != "" && results.Provincial != "NA") {
							Object.assign(queryDetail, {
								Provincial: results.Provincial
							});
						}
						if (results.District != undefined && results.District != "" && results.District != "NA") {
							Object.assign(queryDetail, {
								District: results.District
							});
						}
						if (results.Ward != undefined && results.Ward != "" && results.Ward != "NA") {
							Object.assign(queryDetail, {
								Ward: results.Ward
							});
						}
					}
					Object.assign(queryDetail, {
						BlockStatus: 'ACTIVE'
					});
					console.log("getListMemberById query detail", queryDetail);
					objDb.findMembers(queryDetail, client, function (resultsList) {
						client.close();
						res.send(resultsList);
					});
				} else {
					client.close();
					res.send(null);
				}


			} else {
				client.close();
				res.send(results);
			}
		});
	});
});
server.get('/getListMemberDelegate', authFace, (req, res) => {

	var psid = req.query.psid;
	console.log("getListMemberDelegate psid: ", psid);

	var query = {
		_id: psid
	};
	console.log("getListMemberDelegate query: ", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				results = results[0];
				var queryDetail = {};
				///// layerDelegatelayer- Delegate , được ủy quyền để tăng 1 cấp layer
				if (results.Delegate == null) {
					results.Delegate = 0;
				}
				//var layerDelegate=Number(results.Layer)-Number(results.Delegate);
				//if(layerDelegate<0)
				//{
				//	layerDelegate=0;// chỉ cho Ủy quyền đến cấp admin
				//}
				//console.log("getListMemberDelegate layerDelegate: ", layerDelegate);
				if (results.BlockStatus == "ACTIVE" && results.Layer == results.Level) {
					console.log("getListMemberDelegate Level : ", results.Level);
					///// layer+1 để thấy dưới 1 lớp
					var layer = Number(results.Layer) + 1;

					if (results.Level == 1 || results.Level == 0) {
						results.Provincial = "";
						results.District = "";
						results.Ward = "";

					}
					////// Chỉ lấy ra thành viên cùng cấp
					Object.assign(queryDetail, {
						Level: results.Level
					});
					///// Lấy ra thành viên cùng lớp
					if (results.Layer != undefined & results.Layer != "" & layer != 1 && layer != 0) {
						Object.assign(queryDetail, {
							Layer: Number(layer)
						});
					}
					if (layer != 1 && layer != 0) {
						if (results.Provincial != undefined && results.Provincial != "" && results.Provincial != "NA") {
							Object.assign(queryDetail, {
								Provincial: results.Provincial
							});
						}
						if (results.District != undefined && results.District != "" && results.District != "NA") {
							Object.assign(queryDetail, {
								District: results.District
							});
						}
						if (results.Ward != undefined && results.Ward != "" && results.Ward != "NA") {
							Object.assign(queryDetail, {
								Ward: results.Ward
							});
						}
					}
					Object.assign(queryDetail, {
						BlockStatus: 'ACTIVE'
					});
					console.log("getListMemberDelegate query detail", queryDetail);
					objDb.findMembers(queryDetail, client, function (resultsList) {
						client.close();
						res.send(resultsList);
					});
				} else {
					client.close();
					res.send(null);
				}


			} else {
				client.close();
				res.send(results);
			}
		});
	});
});
server.get('/getListMemberKsv', authFace, (req, res) => {

	var psid = req.query.psid;
	console.log("getListMemberKsv psid: ", psid);

	var query = {
		_id: psid
	};
	console.log("getListMemberKsv query: ", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length > 0) {
				results = results[0];

				var queryDetail = {
					_id: {
						$ne: psid
					}
				}; /////Loại bỏ chính mình ra khỏi danh sách
				////layerDelegatelayer- Delegate , được ủy quyền để tăng 1 cấp layer
				if (results.Delegate == null) {
					results.Delegate = 0;
				}
				var layerDelegate = Number(results.Layer) - Number(results.Delegate);
				if (layerDelegate < 0) {
					layerDelegate = 0; // chỉ cho Ủy quyền đến cấp admin
				}
				console.log("getListMemberKsv layerDelegate: ", layerDelegate);
				if (results.BlockStatus == "ACTIVE" && layerDelegate == results.Level) {
					console.log("getListMemberDelegate Level : ", results.Level);
					///// layer+1 + va + ủy quyền để thấy dưới 1 lớp
					var layer = layerDelegate + 1;
					//var layer = Number(results.Layer) + 1;

					if (results.Level == 1 || results.Level == 0) {
						results.Provincial = "";
						results.District = "";
						results.Ward = "";

					}
					////// Chỉ lấy ra thành viên cùng cấp
					//					Object.assign(queryDetail, {
					//						Level: results.Level
					//					});
					///// Lấy ra thành viên cùng lớp

					if (results.Level == 1) {
						////// Lấy cả layer = 1 và layer =2
						Object.assign(queryDetail, {
							$or: [{
								Layer: 2
							}, {
								Layer: 1
							}]
						});
					} else {
						/// Lấy leyer dưới 1 cấp
						if (results.Layer != undefined && results.Layer != "" && layer != 1 && layer != 0) {
							Object.assign(queryDetail, {
								Layer: Number(layer)
							});
						}
					}
					if (layer != 1 && layer != 0) {
						if (results.Provincial != undefined && results.Provincial != "" && results.Provincial != "NA") {
							Object.assign(queryDetail, {
								Provincial: results.Provincial
							});
						}
						if (results.District != undefined && results.District != "" && results.District != "NA") {
							Object.assign(queryDetail, {
								District: results.District
							});
						}
						if (results.Ward != undefined && results.Ward != "" && results.Ward != "NA") {
							Object.assign(queryDetail, {
								Ward: results.Ward
							});
						}
					}
					//					Object.assign(queryDetail, {
					//						BlockStatus: 'ACTIVE'
					//					});
					console.log("getListMemberDelegate query detail", queryDetail);
					objDb.findMembers(queryDetail, client, function (resultsList) {
						client.close();
						res.send(resultsList);
					});
				} else {
					client.close();
					res.send(null);
				}


			} else {
				client.close();
				res.send(results);
			}
		});
	});
});
server.get('/getMember', authFace, (req, res) => {
	//res.setHeader('X-Frame-Options', 'ALLOW-FROM '+SERVER_URL);
	var name = req.query.name;
	var psid = req.query.psid;
	var provincial = req.query.provincial;
	var districts = req.query.districts;
	var wards = req.query.wards;
	var position = req.query.position;
	var level = req.query.level;
	var layer = req.query.layer;
	console.log("getMember layer: ", layer);
	if (psid == null || psid == 'all')
		psid = "";
	if (name == null || name == 'all')
		name = "";
	if (provincial == null || provincial == 'all' || provincial == 'NA')
		provincial = "";
	if (districts == null || districts == 'all' || districts == 'NA')
		districts = "";
	if (wards == null || wards == 'all' || wards == 'NA')
		wards = "";
	if (position == null || position == 'all' || position == 'NA')
		position = "";
	if (level == null || level == 'all' || level == 'NA')
		level = "";
	if (layer == null || layer == 'all' || layer == 'NA')
		layer = "";
	//var reqQuery=  req.query.strQuery
	var query = {};
	if (name != "") {
		//{ "Name": {'$regex': '.*nam.*'}}
		name = ".*" + name + ".*";
		Object.assign(query, {
			Name: {
				$regex: name
			}
		});
	}
	if (psid != "") {
		Object.assign(query, {
			_id: psid
		});
	}
	if (layer != undefined & layer != "" & Number(layer) != 1 && Number(layer) != 0) {
		Object.assign(query, {
			Layer: Number(layer)
		});
	}
	if (Number(layer) != 1 && Number(layer) != 0) {
		if (provincial != "") {
			Object.assign(query, {
				Provincial: provincial
			});
		}
		if (districts != "") {
			Object.assign(query, {
				District: districts
			});
		}
		if (wards != "") {
			Object.assign(query, {
				Ward: wards
			});
		}
		if (position != "") {
			Object.assign(query, {
				Position: position
			});
		}
	}
	console.log("GetMember query", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});

//Toanva add getMemberCMS
server.get('/getMemberCMS', auth, (req, res) => {
	var name = req.query.name;
	var psid = req.query.psid;
	var provincial = req.query.provincial;
	var districts = req.query.districts;
	var wards = req.query.wards;
	var position = req.query.position;
	var level = req.query.level;
	var layer = req.query.layer;
	var blockstatus = req.query.blockstatus;
	var phone = req.query.phone;
	if (psid == null || psid == 'all')
		psid = "";
	if (name == null || name == 'all')
		name = "";
	if (provincial == null || provincial == 'all' || provincial == 'NA')
		provincial = "";
	if (districts == null || districts == 'all' || districts == 'NA')
		districts = "";
	if (wards == null || wards == 'all' || wards == 'NA')
		wards = "";
	if (position == null || position == 'all' || position == 'NA')
		position = "";
	if (level == null || level == 'all' || level == 'NA')
		level = "";
	if (layer == null || layer == 'all' || layer == 'NA')
		layer = "";
	if (blockstatus == null || blockstatus == 'all')
		blockstatus = "";
	if (phone == null || phone == 'all')
		phone = "";
	var query = {};
	if (name != "") {
		name = ".*" + name + ".*";
		Object.assign(query, {
			Name: {
				$regex: name
			}
		});
	}
	if (psid != "") {
		Object.assign(query, {
			_id: psid
		});
	}
	if (blockstatus != "") {
		Object.assign(query, {
			BlockStatus: blockstatus
		});
	}

	if (phone != "") {
		phone = ".*" + phone + ".*";
		Object.assign(query, {
			Phone: {
				$regex: phone
			}
		});
	}
	if (level != "") {
		Object.assign(query, {
			Level: parseInt(level)
		});
	}
	if (provincial != "") {
		Object.assign(query, {
			Provincial: provincial
		});
	}
	if (districts != "") {
		Object.assign(query, {
			District: districts
		});
	}
	if (wards != "") {
		Object.assign(query, {
			Ward: wards
		});
	}
	if (position != "") {
		Object.assign(query, {
			Position: position
		});
	}
	console.log("GetMemberCMS query", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			client.close();
			res.send(results);
		});
	});
});
//Toanva getMemberCMS end
server.get('/getKycMembers', authKsv, (req, res) => {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM ' + SERVER_URL);
	var query = {};
	//	var name = req.query.name;
	var provincial = req.query.provincial;
	var districts = req.query.districts;
	var wards = req.query.wards;

	if (provincial == null || provincial == 'all')
		provincial = "";
	if (districts == null || districts == 'all')
		districts = "";
	if (wards == null || wards == 'all')
		wards = "";
	//	var position = req.query.position;
	//	//var reqQuery=  req.query.strQuery
	//	
	//	if (name != "") {
	//		//{ "Name": {'$regex': '.*nam.*'}}
	//		name = ".*" + name + ".*";
	//		Object.assign(query, {
	//			Name: {
	//				$regex: name
	//			}
	//		});
	//	}
	if (provincial != "") {
		Object.assign(query, {
			Provincial: provincial
		});
	}
	if (districts != "") {
		Object.assign(query, {
			Districts: districts
		});
	}
	if (wards != "") {
		Object.assign(query, {
			Wards: wards
		});
	}
	//	if (position != "") {
	//		Object.assign(query, {
	//			Position: position
	//		});
	//	}
	console.log("getKycMembers query", query);
	objDb.getConnection(function (client) {
		objDb.findKycMembers(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
});
server.post('/insertAiMessage.bot', auth, (req, res) => {
	let body = req.body;
	console.log('Re insertAiMessage: ', body);
	var mydate = new Date();
	var inputDate = new Date(mydate.toISOString());
	var strQuestion = body.Question.toLowerCase().replace('?', '').replace('.', '').replace(',', '').trim();
	strQuestion = strQuestion.replace('/', '').replace(';', '').replace('[', '').replace(']', '').replace('!', '');
	console.log("strQuestion: ", strQuestion);
	var objAi = {
		"Question": strQuestion,
		"Answer": body.Answer,
		"BlockStatus": body.BlockStatus,
		"InsertDay": inputDate,
		"Status": body.Status
	};
	mess = {};
	objDb.getConnection(function (client) {
		objDb.insertAiMessage(objAi, client, function (err, results) {
			//	   res.send(results);
			//console.log(results);
			if (err) {
				mess.err = err;
				console.log("insertAiMessage Err", err);
			} else {
				mess.ss = "Thêm mới thành công!";
				console.log("insertAiMessage SS");
				//sendBackRegister(body.psid, returnMessage);
			}
			console.log("insertAiMessage: Close Connction")
			client.close();
		});
	});
	res.send(mess);

});
server.post('/deleteAiMessage.bot', auth, (req, res) => {
	let body = req.body;
	console.log('Re deleteAiMessage: ', body);
	mess = {};
	if (body.Id) {
		var id = body.Id;
		objDb.getConnection(function (client) {
			objDb.deleteAiMessage(id, client, function (err, results) {
				//	   res.send(results);
				//console.log(results);
				if (err) {
					mess.err = err;
					console.log("deleteAiMessage Err", err);
				} else {
					mess.ss = "Xóa thành công!";
					console.log("deleteAiMessage SS");
					//sendBackRegister(body.psid, returnMessage);
				}
				client.close();
			});
		});
	}
	res.send(mess);

});
server.get('/getAiMessage', auth, (req, res) => {

	var query = {};
	objDb.getConnection(function (client) {
		objDb.findAiMessage(query, client, function (results) {
			client.close();
			res.send(results);

		});
	});
	//res.send(req.query.idProvincial);
});
server.get('/info.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/info.html', {
			root: __dirname
		});
	}
});
server.get('/help.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/help.html', {
			root: __dirname
		});
	}
});
server.post('/helppostback.bot', upload.single('somefile'), authFace, (req, res) => {

	let body = req.body;
	req.session.psid = body.psid;
	var psid = body.psid;
	var fullName = body.Name;
	var phone = body.Phone;
	var email = body.Email;
	var content = body.Content;
	var query = {};
	callGetProfile(psid, function (objFacebook) {
		var objFacebook = JSON.parse(objFacebook);
		console.log("helppostback callGetProfile: ", objFacebook);
		imgUrl = objFacebook.profile_pic;
		objDb.getConnection(function (client) {
			objDb.findSupport(query, client, function (results) {
				client.close();
				console.log("helppostback :", content);
				console.log("helppostback Psid:", results[0].Psid);
				sendTextMessage(results[0].Psid, "Nosa nhận được yêu cầu hỗ trợ của " + fullName + ", ĐT :" + phone + " , Email:" + email + ", Tên Facebook là : " + objFacebook["last_name"] + " " + objFacebook["first_name"] + ", nội dung cần được hỗ trợ là:" + content + ". Ảnh đại diện facebook:");
				sendUrlMessage(results[0].Psid, "image", imgUrl, function (error, response, body) {
					if (error) throw error;
					console.log("sendUrlMessage:");
					//sendTextMessage("1704606899576704", "Nội dung cần được hỗ trợ : "+content);
					var button = [{
						type: "web_url",
						url: SERVER_URL + "/replyhelp.bot?fpsid=" + psid + "&qs=" + content,
						title: "Trả lời",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/replyhelp.bot?fpsid=" + psid + "&qs=" + content
					}];
					sendButtonMessage(results[0].Psid, "Trả lời câu hỏi!", button);
				});
				///////Reply member
				var msg = "Nosa đã nhận được yêu cầu hỗ trợ của " + objFacebook["last_name"] + " " + objFacebook["first_name"] + ". Nosa sẽ phản hồi lại bạn sớm nhất có thể. Bạn có muốn tiếp tục nói chuyện với Nosa không ?";
				quickReplies = [{
					content_type: "text",
					title: "Có chứ",
					payload: "confirm",
					image_url: SERVER_URL + "/img/OkLike.png"
				}, {
					content_type: "text",
					title: "Hỗ trợ",
					payload: "help",
					image_url: SERVER_URL + "/img/helps.png"
				},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
				sendQuickMessage(body.psid, msg, quickReplies);
				res.status(200).send('Please close this window to return to the conversation thread.');
			});
		});
		/// end 1
	});

});
server.get('/replyhelp.bot', (req, res, next) => {
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
		req.session.faceUser = true;
		//res.render('register');
		res.sendFile('views/replyhelp.html', {
			root: __dirname
		});
	}
});
server.post('/replyhelppostback.bot', upload.single('somefile'), authFace, (req, res) => {

	let body = req.body;
	req.session.psid = body.psid;
	var fromPsid = body.fromPsid;
	var Question = body.Question;
	var content = body.Content;
	var msg = "Nosa đã nhận được yêu cầu hỗ trợ của bạn như sau : " + Question + ". Nosa xin được trả lời câu hỏi : " + content + " . Bạn muốn tiếp tục trò chuyện với Nosa chứ ?";
	quickReplies = [{
		content_type: "text",
		title: "Có chứ",
		payload: "confirm",
		image_url: SERVER_URL + "/img/OkLike.png"
	}, {
		content_type: "text",
		title: "Hỗ trợ",
		payload: "help",
		image_url: SERVER_URL + "/img/helps.png"
	},{
		content_type: "text",
		title: "Hướng dẫn",
		payload: "guide",
		image_url: SERVER_URL + "/img/guide.png"
	}];
	sendQuickMessage(fromPsid, msg, quickReplies);
	res.status(200).send('Please close this window to return to the conversation thread.');


});
////Bản đồ phân bổ nông ngiệp
server.get('/map.bot', (req, res) => {
	console.log("Call map.bot");
	res.render('map');
	//res.send('Get Id From : '+ fromId + " = "+ data);
});

function insertMember(psid,imgUrl,objMember,returnMessage, client,res){
	//// start insert member
	objDb.insertMembers(objMember, client, function (err, results) {
		//	   res.send(results);
		//console.log(results);
		if (err) {
			//client.close();
			sendTextMessage(psid, 'Echo:' + err);
		} else {

			console.log("registerspostback: ", objMember);
			//writeFile(imgName,body.DataImgAvatar,dir,body.psid);
			sendTextMessage(psid, "Cảm ơn bạn đã cung cấp thông tin. Nosa kiểm tra lại nhé. Dưới đây là ảnh đại diện Facebook của bạn :");
			sendUrlMessage(psid, "image", imgUrl, function (error, response, bd) {
				if (error) throw error;
				console.log("sendUrlMessage:");
				sendBackRegister(psid, returnMessage);

			});

			client.close();
			res.status(200).send('Please close this window to return to the conversation thread.');
			//res.send(objMember);
		}

		//// enc insert member
	});
};

function callGetLocation(address,callback){
	request({
			uri: 'https://maps.googleapis.com/maps/api/geocode/json',
			qs: {
				address: address
			}},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {

				console.log("callGetLocation:",body);
				callback(JSON.parse(body));
			} else {
				console.error("Failed calling callGetLocation", response.statusCode, response.statusMessage, body.error);
				console.error(response.error);
				callback(null);
			}
		});
};
/// end rowter
function callSendAPI1(messageData) {
	var messageTyping = {
		recipient: {

			id: messageData.recipient.id
		},
		sender_action: "typing_on"
	};

	request({
			uri: 'https://graph.facebook.com/v3.1/me/messages',
			qs: {
				access_token: PAGE_ACCESS_TOKEN
			},
			method: 'POST',
			json: messageTyping

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
				//console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
				console.error(response.error);
			}
		});
};

function callSendAPI(messageData) {
	///console.log("callSendAPI",request) ;

	//console.log("callSendAPI:",messageData.recipient.id)
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
				//sendTypingOff(recipientId);
				if (messageId) {
					console.log("Successfully sent message with id %s to recipient %s",
						messageId, recipientId);
				} else {
					console.log("Successfully called Send API for recipient %s",
						recipientId);
				}

			} else {
				console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
				console.error(response.error);
			}
		});
};

function callSendAPIReg(messageData, callback) {
	///console.log("callSendAPI",request) ;

	//console.log("callSendAPI:",messageData.recipient.id)
	request({
			uri: 'https://graph.facebook.com/v3.1/me/messages',
			qs: {
				access_token: PAGE_ACCESS_TOKEN
			},
			method: 'POST',
			json: messageData

		},
		function (error, response, body) {

			callback(error, response, body);
		});
};

function callSendAPICreatives(messageData, callback) {
	///console.log("callSendAPI",request) ;

	//console.log("callSendAPI:",messageData.recipient.id)
	request({
			uri: 'https://graph.facebook.com/v3.0/me/message_creatives',
			qs: {
				access_token: PAGE_ACCESS_TOKEN
			},
			method: 'POST',
			json: messageData

		},
		function (error, response, body) {

			callback(error, response, body);
		});
};

function callSendAPIBroadcast(messageData, callback) {
	///console.log("callSendAPI",request) ;

	//console.log("callSendAPI:",messageData.recipient.id)
	request({
			uri: 'https://graph.facebook.com/v3.0/me/broadcast_messages',
			qs: {
				access_token: PAGE_ACCESS_TOKEN
			},
			method: 'POST',
			json: messageData

		},
		function (error, response, body) {

			callback(error, response, body);
		});
};

function callSendAPIFile(messageData) {
	var endpoint = "https://graph.facebook.com/v3.0/me/messages?access_token=" + PAGE_ACCESS_TOKEN;
	var r = request.post(endpoint, function (err, httpResponse, body) {
		if (err) {
			return console.error("upload failed >> \n", err)
		};
		console.log("upload successfull >> \n", body); //facebook always return 'ok' message, so you need to read error in 'body.error' if any
		sendOneQuick(messageData.recipient.id, "Bạn có muốn tiếp tục trò truyện với Nosa không?", "Có chứ", "confirm", "advisory.png");
	});
	var form = r.form();
	form.append('recipient', JSON.stringify(messageData.recipient));
	form.append('message', JSON.stringify(messageData.message));
	form.append('filedata', messageData.filedata); //no need to stringify!
};

function callGetProfile(psid, callback) {

	request('https://graph.facebook.com/v3.1/' + psid + '?fields=first_name,last_name,profile_pic&access_token=' + PAGE_ACCESS_TOKEN, function (error, response, body) {

		//nếu có lỗi
		if (!error && response.statusCode == 200) {
			var obj = JSON.parse(body);
			console.log("callGetProfile: ", obj.last_name + ' ' + obj.first_name + ' ' + obj.profile_pic);
			var imgUrl = obj.profile_pic;
			try {
				objDb.getConnection(function (client) {
					objDb.updateAvatarMemeber(psid, imgUrl, client, function (results) {
						console.log('updateAvatarMemeber SS:', psid);
						client.close();
					});
				});
			} catch (err) {
				console.error("updateAvatarMemeber: ", err);
			}
			callback(body);
		} else {
			console.error(response.error);
		}
	});
};

function sendShareContents(recipientId, objPayload) {

	var messageData = {
		recipient: {
			id: recipientId
		},
		type: "element_share",
		share_contents: {
			attachment: {
				type: template,
				payload: objPayload
			}
		}
	};
	callSendAPI(messageData);
};

function sendTypingOff(recipientId) {
	var messageData = {
		recipient: {

			id: recipientId
		},
		sender_action: "typing_off"
	};
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
				//console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
				console.error(response.error);
			}
		});
};

function sendTypingOn(recipientId) {
	var messageData = {
		recipient: {

			id: recipientId
		},
		sender_action: "typing_on"
	};

	//callSendMess(messageData);
};

function sendTextMessage(recipientId, messageText) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: messageText,
			metadata: "DEVELOPER_DEFINED_METADATA"
		}
	};

	callSendAPI(messageData);
};

function sendFileMessage(recipientId, messageText, fileType, file_loc) {
	var readStream = fs.createReadStream(file_loc);

	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: fileType,
				payload: {}
			}
		},
		filedata: readStream //+";type=image/png"
	};
	callSendAPIFile(messageData);
};

function sendUrlMessage(recipientId, fileType, url, callback) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: fileType,
				payload: {
					"url": url,
					"is_reusable": true
				}
			}
		}
	};
	callSendAPIReg(messageData, function (error, response, body) {

		callback(error, response, body);
	});
};

function sendTextMessageWelecom(recipientId, messageText) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: messageText,
			metadata: "DEVELOPER_DEFINED_METADATA"
		}
	};

	callSendAPI(messageData);
};
//// Call Webview
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
						url: SERVER_URL + "/register.bot?psid=" + recipientId,
						title: "Điểm danh",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/register.bot?psid=" + recipientId
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendBasicRegisterForm(recipientId, msg) {
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
						url: SERVER_URL + "/basicregister.bot?psid=" + recipientId,
						title: "Điểm danh",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/basicregister.bot?psid=" + recipientId
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendRegisterTempForm(recipientId, msg) {
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
						url: SERVER_URL + "/registertemp.bot",
						title: "Điểm danh",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/registertemp.bot"
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendMessageIProducts(recipientId, msg) {
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
						url: SERVER_URL + "/iproducts.bot?psid=" + recipientId,
						title: "Cung cấp thông tin",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/iproducts.bot?psid=" + recipientId
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendButtonMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "Chúng ta cùng làm quen bằng thủ tục điểm danh nhé",
					buttons: [{
						type: "web_url",
						url: SERVER_URL + "/register.bot",
						title: "Điểm danh",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/register.bot"
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendButtonMessage(recipientId, msg, buttons) {
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
					buttons: buttons
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendGenericMessage(recipientId , elements) {
//	console.log("Help 1",recipientId);
	var messageData = {
		recipient: {
			id: recipientId
		},message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: elements
				}
			}
		}
	};
	//console.log("Help 2",messageData);
	callSendAPI(messageData);
};

function sendBackRegister(recipientId, mgs) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: mgs,
					buttons: [{
						type: "postback",
						title: "Chuẩn",
						"payload": "confirm"
					}, {
						type: "web_url",
						url: SERVER_URL + "/register.bot?psid=" + recipientId,
						title: "Điểm danh lại",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/register.bot?psid=" + recipientId
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendBasicBackRegister(recipientId, mgs) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: mgs,
					buttons: [{
						type: "postback",
						title: "Chuẩn",
						"payload": "confirm"
					}, {
						type: "web_url",
						url: SERVER_URL + "/basicregister.bot?psid=" + recipientId,
						title: "Điểm danh lại",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/basicregister.bot?psid=" + recipientId
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendBackRegisterTemp(recipientId, mgs) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: mgs,
					buttons: [{
						type: "postback",
						title: "Chuẩn",
						"payload": "confirm"
					}, {
						type: "web_url",
						url: SERVER_URL + "/registertemp.bot",
						title: "Điểm danh lại",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/registertemp.bot"
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendBackProduct(recipientId, mgs) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: mgs,
					buttons: [{
						type: "postback",
						title: "Chuẩn",
						"payload": "cfp"
					}]
				}
			}
		}
	};
	callSendAPI(messageData);
};

function sendOneQuick(recipientId, msg, tile, payload, img) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: msg,
			quick_replies: [{
				content_type: "text",
				title: tile,
				payload: payload,
				image_url: SERVER_URL + "/img/" + img
			}]
		}

	};
	callSendAPI(messageData);
};

function sendQuickMessage(recipientId, msg, quickReplies) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: msg,
			quick_replies: quickReplies
		}

	};
	callSendAPI(messageData);
};

function sendBroadcast(recipientId, msg) {

	var messageData = {
		"dynamic_text": {
			"text": msg,
			"fallback_text": msg
		}
	};

};

function sendMessageWelecome(recipientId, msg) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
            text: msg + " Mình là Thani - trợ lý ảo quản lý chương trình Viết về thầy cô giáo dục đặc biệt. Bạn muốn chia sẻ gì cùng mình nào?",
			quick_replies: [{
				content_type: "text",
				title: "Cán bộ đoàn",
				payload: "CBD",
				image_url: SERVER_URL + "/img/doan.png"
			}, {
				content_type: "text",
				title: "Cán bộ hội",
				payload: "CBH",
				image_url: SERVER_URL + "/img/HoiMin.png"
			}, {
				content_type: "text",
				title: "Khác",
				payload: "other",
				image_url: SERVER_URL + "/img/logomin.png"
			},{
				content_type: "text",
				title: "Hướng dẫn",
				payload: "guide",
				image_url: SERVER_URL + "/img/guide.png"
			}]
		}
	};
	callSendAPI(messageData);
};

function sendMessageConfimRegister(recipientId) {


	var query = {
		_id: recipientId
	};
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {

				var messageData = {
					recipient: {
						id: recipientId
					},
					message: {
						text: "Cảm ơn " + results[0].Name + ". Bạn là một " + results[0].Position + " gương mẫu đấy. Nosa là chuyên gia làm kinh tế trong lĩnh vực nông sản đấy. Hãy nói cho Nosa biết vấn đề bạn quan tâm nào.",
						quick_replies: [{
							content_type: "text",
							title: "Xây dựng thương hiệu",
							payload: "xdth",
							image_url: SERVER_URL + "/img/star.png"
						}, {
							content_type: "text",
							title: "Bán nông sản",
							payload: "bns",
							image_url: SERVER_URL + "/img/salle.png"
						}, {
							content_type: "text",
							title: "Vay vốn SX",
							payload: "vvsx",
							image_url: SERVER_URL + "/img/vv1.png"
						}, {
							content_type: "text",
							title: "Hướng dẫn làm DA",
							payload: "hdlda",
							image_url: SERVER_URL + "/img/helps.png"
						}]
					}
				};
				callSendAPI(messageData);

			}
			client.close();
		});
	});

};

function sendMessageTrademark(recipientId, msg) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: msg,
			quick_replies: [{
				content_type: "text",
				title: "Global Gap",
				payload: "global gap",
				image_url: SERVER_URL + "/img/globalgap.png"
			}, {
				content_type: "text",
				title: "VietGap",
				payload: "vietgap",
				image_url: SERVER_URL + "/img/vietgap.png"
			}, {
				content_type: "text",
				title: "Chỉ dẫn địa lý",
				payload: "cddl",
				image_url: SERVER_URL + "/img/map.png"
			}]
		}

	};
	callSendAPI(messageData);
};

function sendMessageLoan(recipientId, msg) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: msg,
			quick_replies: [{
				content_type: "text",
				title: "Thủ tục vay vốn",
				payload: "nd612015ndcp",
				image_url: SERVER_URL + "/img/logomin.png"
			}, {
				content_type: "text",
				title: "Nhu cầu vay vốn",
				payload: "ncvv",
				image_url: SERVER_URL + "/img/logomin.png"
			}]
		}

	};
	callSendAPI(messageData);
};

function setAdmin(recipientId) {
	objDb.getConnection(function (client) {
		objDb.setAdminMembers(recipientId, "ACTIVE", client, function (err, results) {

			if (err) {
				//sendTextMessage(body.psid, 'Echo:' + err);
				console.log("setAdminMembers ERR:", err);
				client.close();
				//res.send(err);
			} else {
				console.log("set Admin is id:", recipientId);
				client.close();
				//res.send(err);
			}

			////  end  findProvincial
		});

		/// end con
	});
};

function getAnswer(question, callback) {
	question = question.toLowerCase().replace('?', '').replace('.', '').replace(',', '').replace(/\s\s/g, " ").trim();
	question = question.replace('/', '').replace(';', '').replace('[', '').replace(']', '').replace('!', '');
	question = question.replace(/[-\/\\^$*+?.()|[\]{}]/g, "").replace(/\s\s/g, " ");
	//question= str.replace(new RegExp(searchStr, 'gi'), replaceStr);
	var query = {
		Question: question
	};
	//{Question: {$regex: question}}
	console.log("GetAnswer query:", query);
	objDb.getConnection(function (client) {
		objDb.findAiMessage(query, client, function (results) {
			//res.send(results);
			console.log("GetAnswer :", results);
			client.close();
			callback(results);

		});
	});
};

function sendInfo(recipientId) {

	var query = {
		_id: recipientId
	};
	//console.log("sendKSV findMembers", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {
				results = results[0];
				//console.log("findMembers:",results);
				var date = new Date(results.Birthday);
				var birthday = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
				var msg = "Mời " + results.Name + " xem hồ sơ chi tiết";
				//				var msg="Bạn tên là : "+results.Name +" sinh ngày "+birthday+ ", số điện thoại : 	"+results.Phone+", email: " +results.Email+", chức vụ " +results.Position + ", chi hội "+ results.Branch +" ,Tỉnh/TP :"+results.Provincial+" Quận/Huyện : "+results.District +" , Phường/Xã : " +results.Ward +". Bạn chọn có để xem chi tiết?";

				var button = [{
					type: "web_url",
					url: SERVER_URL + "/info.bot?l=",
					title: "Hồ sơ chi tiết",
					messenger_extensions: true,
					webview_height_ratio: "tall",
					fallback_url: SERVER_URL + "/info.bot?l="
				}];
				//msg="Rất hân hạnh được làm việc cùng một "+results.Position+" như "+results.Name +", chọn 'Có' để xem danh sách các Hội viên mà bạn cần xét duyệt. ";
				sendButtonMessage(recipientId, msg, button);
				//				sendUrlMessage(recipientId,"image",results.ImgUrl,function(error, response, bd){
				//						   if (error) throw error;
				//						   console.log("sendUrlMessage:");
				//					
				//					       quickReplies=[{
				//										content_type: "text",
				//										title: "Có chứ",
				//										payload: "confirm",
				//										image_url: SERVER_URL+"/img/OkLike.png"
				//									},
				//									{
				//										content_type: "text",
				//										title: "Hỗ trợ",
				//										payload: "help",
				//										image_url: SERVER_URL+"/img/helps.png"
				//									}];
				//							sendQuickMessage(recipientId,msg,quickReplies);					 
				//
				//						});

			} else {
				callGetProfile(recipientId, function (profile) {
					console.log("Get profile: ", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " chưa là thành viên của hội hoạc bạn chưa thực hiện việc điểm danh, vậy chúng ta hãy làm quen bằng thủ tục điểm danh nhé.";
					sendRegisterForm(recipientId, msg);
					//objLog.Answer=msg;
					///saveLogs(objLog);
					//sendMessageWelecome(senderID,msg);
				});
			}
			client.close();
			//res.send(results);

		});
	});
};

function sendNoReply(recipientId) {

	var query = {
		_id: recipientId
	};
	//console.log("sendKSV findMembers", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {
				results = results[0];
				//console.log("findMembers:",results);
				var msg = "Bạn tên là : " + results.Name + ", chức vụ " + results.Position + ", trạng thái " + results.BlockStatus + " ,Tỉnh/TP :" + results.Provincial + " Quận/Huyện : " + results.District + " , Phường/Xã : " + results.Ward;

				var provincial = results.Provincial;
				var districts = results.District;
				var wards = results.Ward;

				if (results.BlockStatus == "ACTIVE") {
					msg = "Câu hỏi này để Nosa suy nghĩ đã. Bạn có muốn thảo luận với Nosa các vấn đề khác không ? ";
					quickReplies = [{
						content_type: "text",
						title: "Có chứ",
						payload: "confirm",
						image_url: SERVER_URL + "/img/OkLike.png"
					}, {
						content_type: "text",
						title: "Hỗ trợ",
						payload: "help",
						image_url: SERVER_URL + "/img/helps.png"
					},{
						content_type: "text",
						title: "Hướng dẫn",
						payload: "guide",
						image_url: SERVER_URL + "/img/guide.png"
					}];
					sendQuickMessage(recipientId, msg, quickReplies);
				} else {
					msg = "Câu hỏi này để Nosa suy nghĩ đã. Bạn có muốn thảo luận với Nosa các vấn đề khác không ? ";
					quickReplies = [{
						content_type: "text",
						title: "Có chứ",
						payload: "confirm",
						image_url: SERVER_URL + "/img/OkLike.png"
					}, {
						content_type: "text",
						title: "Hỗ trợ",
						payload: "help",
						image_url: SERVER_URL + "/img/helps.png"
					},{
						content_type: "text",
						title: "Hướng dẫn",
						payload: "guide",
						image_url: SERVER_URL + "/img/guide.png"
					}];
					sendQuickMessage(recipientId, msg, quickReplies);
				}
			} else {
				callGetProfile(recipientId, function (profile) {
					console.log("Get profile: ", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " chưa là thành viên của hội hoạc bạn chưa thực hiện việc điểm danh, vậy chúng ta hãy làm quen bằng thủ tục điểm danh nhé.";
					sendRegisterForm(recipientId, msg);
					//objLog.Answer=msg;
					///saveLogs(objLog);
					//sendMessageWelecome(senderID,msg);
				});
			}
			client.close();
			//res.send(results);

		});
	});
};

function sendKSV(recipientId) {

	var query = {
		_id: recipientId
	};
	//console.log("sendKSV findMembers", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {
				results = results[0];
				//console.log("findMembers:",results);
				var msg = "Bạn tên là : " + results.Name + ", chức vụ " + results.Position + ", trạng thái " + results.BlockStatus + " ,Tỉnh/TP :" + results.Provincial + " Quận/Huyện : " + results.District + " , Phường/Xã : " + results.Ward;

				//				var provincial = results.Provincial;
				//				var districts = results.District;
				//				var wards = results.Ward;
				///// layerDelegatelayer- Delegate , được ủy quyền để tăng 1 cấp layer
				if (results.Delegate == null) {
					results.Delegate = 0;
				}
				var layerDelegate = Number(results.Layer) - Number(results.Delegate);
				if (layerDelegate < 0) {
					layerDelegate = 0; // chỉ cho Ủy quyền đến cấp admin
				}


				if (results.BlockStatus == "ACTIVE" && layerDelegate == results.Level) {
					///// layer = layerDelegate+1 để thấy dưới 1 cấp
					//					var layer = layerDelegate + 1;
					//					if (results.Level == 1 || results.Level == 0) {
					//						provincial = 'NA';
					//						districts = 'NA';
					//						wards = 'NA';
					//
					//					}
					//console.log("test","/botksv.bot?p="+provincial+"&d="+districts+"&w="+wards);
					var button;
					if (results.Level == 1 && results.Position == "Chủ tịch") {
						button = [{
							type: "web_url",
							url: SERVER_URL + "/botnoksv.bot",
							title: "Có",
							messenger_extensions: true,
							webview_height_ratio: "tall",
							fallback_url: SERVER_URL + "/botnoksv.bot"
						}];

					} else {
						button = [{
							type: "web_url",
							url: SERVER_URL + "/botksv.bot",
							title: "Có",
							messenger_extensions: true,
							webview_height_ratio: "tall",
							fallback_url: SERVER_URL + "/botksv.bot"
						}];
					}
					msg = "Rất hân hạnh được làm việc cùng một " + results.Position + " như " + results.Name + ", chọn 'Có' để xem danh sách các Hội viên mà bạn cần xét duyệt. ";
					sendButtonMessage(recipientId, msg, button);

				} else {
					msg = "Tính năng xác thực Hội viên chỉ mở cho chức danh chủ tịch và đã được xác thực trước đó, nếu " + results.Name + " là chủ tịch mà chưa được xác thực vui lòng liên hệ cán bộ Hội cấp trên để được xác thực nhé! " + results.Name + " có muốn tiếp tục trò chuyện cùng Nosa không?";
					quickReplies = [{
						content_type: "text",
						title: "Có chứ",
						payload: "confirm",
						image_url: SERVER_URL + "/img/OkLike.png"
					}, {
						content_type: "text",
						title: "Hỗ trợ",
						payload: "help",
						image_url: SERVER_URL + "/img/helps.png"
					},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
					sendQuickMessage(recipientId, msg, quickReplies);
				}
			} else {
				callGetProfile(recipientId, function (profile) {
					console.log("Get profile: ", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " chưa là thành viên của hội hoạc bạn chưa thực hiện việc điểm danh, vậy chúng ta hãy làm quen bằng thủ tục điểm danh nhé.";
					sendRegisterForm(recipientId, msg);
					//objLog.Answer=msg;
					///saveLogs(objLog);
					//sendMessageWelecome(senderID,msg);
				});
			}
			client.close();
			//res.send(results);

		});
	});
};

function sendSellProduct(recipientId) {

	var query = {
		_id: recipientId
	};

	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {
				results = results[0];
				var provincial = results.Provincial;
				var districts = results.District;
				var wards = results.Ward;

				if (results.BlockStatus == "ACTIVE" && results.Level > 2) {
					var msgSell = "Đầu ra cho sản phẩm luôn là một vấn đề phức tạp. Để nhận được sự tư vấn về đầu ra cho nông sản bạn hãy cung cấp thông tin vào form dưới nhé!";
					sendMessageIProducts(recipientId, msgSell);

				} else {
					var msg = "Tính năng bán nông sản chỉ mở cho những Hội viên cấp quận/huyện, phường/xã, chi hội đã được xác thực trước đó, " + results.Name + " vui lòng liên hệ cán bộ Hội cấp trên để được xác thực nhé! Bạn có muốn tiếp tục trò chuyện cùng Nosa không?";
					quickReplies = [{
						content_type: "text",
						title: "Có chứ",
						payload: "confirm",
						image_url: SERVER_URL + "/img/OkLike.png"
					}, {
						content_type: "text",
						title: "Hỗ trợ",
						payload: "help",
						image_url: SERVER_URL + "/img/helps.png"
					},{
						content_type: "text",
						title: "Hướng dẫn",
						payload: "guide",
						image_url: SERVER_URL + "/img/guide.png"
					}];
					sendQuickMessage(recipientId, msg, quickReplies);
					//endTextMessage(recipientId,msg);
				}
			} else {
				callGetProfile(recipientId, function (profile) {
					console.log("Get profile: ", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " chưa là thành viên của hội hoạc bạn chưa thực hiện việc điểm danh, vậy chúng ta hãy làm quen bằng thủ tục điểm danh nhé.";
					sendRegisterForm(recipientId, msg);

				});
			}
			client.close();
		});
	});
};

function sendUqKsv(recipientId) {

	var query = {
		_id: recipientId
	};
	//console.log("sendKSV findMembers", query);
	objDb.getConnection(function (client) {
		objDb.findMembers(query, client, function (results) {
			if (results.length == 1) {
				results = results[0];
				//console.log("findMembers:",results);

				if (results.BlockStatus == "ACTIVE" && results.Layer == results.Level) {
					//var date= new Date(results.Birthday);
					//var birthday = date.getDate()+'/'+(date.getMonth() + 1)+'/'+date.getFullYear();
					var msg = "Mời " + results.Name + " sử dụng chức năng Ủy quyền KSV";

					var button = [{
						type: "web_url",
						url: SERVER_URL + "/uqksv.bot?l=",
						title: "Uỷ quyền KSV",
						messenger_extensions: true,
						webview_height_ratio: "tall",
						fallback_url: SERVER_URL + "/uqksv.bot?l="
					}];
					//msg="Rất hân hạnh được làm việc cùng một "+results.Position+" như "+results.Name +", chọn 'Có' để xem danh sách các Hội viên mà bạn cần xét duyệt. ";
					sendButtonMessage(recipientId, msg, button);
				} else {
					callGetProfile(recipientId, function (profile) {
						console.log("Get profile: ", profile);
						var obj = JSON.parse(profile);
						msg = obj["last_name"] + " " + obj["first_name"] + " không được cấp quyền KSV hoạc bạn chưa thực hiện việc điểm danh vậy nên bạn không có quyền dùng chức năng uỷ quyền KSV, vậy chúng ta hãy làm quen bằng thủ tục điểm danh nhé.";
						sendRegisterForm(recipientId, msg);
						//objLog.Answer=msg;
						///saveLogs(objLog);
						//sendMessageWelecome(senderID,msg);
					});
				}
			} else {
				callGetProfile(recipientId, function (profile) {
					console.log("Get profile: ", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " không được cấp quyền KSV hoạc bạn chưa thực hiện việc điểm danh vậy nên bạn không có quyền dùng chức năng uỷ quyền KSV, vậy chúng ta hãy làm quen bằng thủ tục điểm danh nhé.";
					sendRegisterForm(recipientId, msg);
					//objLog.Answer=msg;
					///saveLogs(objLog);
					//sendMessageWelecome(senderID,msg);
				});
			}
			client.close();
			//res.send(results);

		});
	});
};
function sendGuide(recipientId){
	
	var elements=[{
            title: "Hướng dẫn ScanCode!",
            image_url:SERVER_URL +"/images/ns1.jpg",
            subtitle:"Hướng dẫn ScanCode để trò chuyện với NOSA.",
            default_action: {
              type: "web_url",
              url: SERVER_URL +"/single.html?vid=AiN3rcsLnJQ&t",
              messenger_extensions: true,
              webview_height_ratio: "tall",
              fallback_url: SERVER_URL +"/single.html?vid=AiN3rcsLnJQ&t"
            },
            buttons:[{
                type:"web_url",
                url: SERVER_URL + "/single.html?vid=AiN3rcsLnJQ&t",
                title:"Xem ngay"
              }]      
          },{
            title: "Hướng dẫn điểm danh!",
            image_url:SERVER_URL +"/images/ns5.jpg",
            subtitle:"Hướng dẫn điền Form Điểm danh - NOSA.",
            default_action: {
              type: "web_url",
              url: SERVER_URL +"/single.html?vid=vOLdysL32NU&t",
              messenger_extensions: true,
              webview_height_ratio: "tall",
              fallback_url: SERVER_URL +"/single.html?vid=vOLdysL32NU&t"
            },
            buttons:[{
                type:"web_url",
                url: SERVER_URL + "/single.html?vid=vOLdysL32NU&t",
                title:"Xem ngay"
              }]      
          },{
            title: "Hướng dẫn KSV!",
            image_url:SERVER_URL +"/images/ns2.jpg",
            subtitle:"Hướng dẫn sử dụng tính năng KSV - NOSA.",
            default_action: {
              type: "web_url",
              url: SERVER_URL +"/single.html?vid=XwMqLYd5Qeg&t=2s",
              messenger_extensions: true,
              webview_height_ratio: "tall",
              fallback_url: SERVER_URL +"/single.html?vid=XwMqLYd5Qeg&t=2s"
            },
            buttons:[{
                type:"web_url",
                url: SERVER_URL + "/single.html?vid=XwMqLYd5Qeg&t=2s",
                title:"Xem ngay"
              }]      
          },{
            title: "Hướng dẫn đăng nông sản!",
            image_url:SERVER_URL +"/images/ns3.jpg",
            subtitle:"Hướng dẫn điền Form Nông sản - NOSA.",
            default_action: {
              type: "web_url",
              url: SERVER_URL +"/single.html?vid=k3OENdwLHVI&t",
              messenger_extensions: true,
              webview_height_ratio: "tall",
              fallback_url: SERVER_URL +"/single.html?vid=k3OENdwLHVI&t"
            },
            buttons:[{
                type:"web_url",
                url: SERVER_URL + "/single.html?vid=k3OENdwLHVI&t",
                title:"Xem ngay"
              }]      
          },{
            title: "Hướng dẫn UQKSV!",
            image_url:SERVER_URL +"/images/ns4.jpg",
            subtitle:"Hướng dẫn sử dụng tính năng UQKSV - NOSA.",
            default_action: {
              type: "web_url",
              url: SERVER_URL +"/single.html?vid=u9uSoX-T8hY",
              messenger_extensions: true,
              webview_height_ratio: "tall",
              fallback_url: SERVER_URL +"/single.html?vid=u9uSoX-T8hY"
            },
            buttons:[{
                type:"web_url",
                url: SERVER_URL + "/single.html?vid=u9uSoX-T8hY",
                title:"Xem ngay"
              }]      
          }
				  
	];
	//console.log("HElp",elements);
	sendGenericMessage(recipientId,elements);
	
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

		var quickReplyPayload = quickReply.payload;
		console.log("Quick reply for message %s with payload %s",
			messageId, quickReplyPayload);
		switch (quickReplyPayload.toLowerCase()) {
			case 'other':
				//msg = "Xin lỗi bạn, đây là hệ thống dành riêng cho cán bộ của Đoàn TN và Hội LHTN. Nếu bạn quan tâm xin liên hệ với cán bộ Đoàn chuyên trách của địa phương đang cư trú. Xin cảm ơn.";
				msg = 'Cảm ơn sự quan tâm của Bạn dành cho sản phẩm của Hội LHTN Việt Nam. Xin mời bạn điền thông tin để chúng ta có thể làm quen với nhau';
				sendBasicRegisterForm(senderID, msg);
				break;
			case 'cbd':
				//msg = "Như vậy bạn là một cán bộ đoàn. Chúng ta hãy làm quen với nhau bằng thủ tục điểm danh nhé!";
				//sendRegisterForm(senderID, msg);
				msg = "Tính năng dành cho Cán Bộ Đoàn đang được hoàn thiện. Nosa sẽ liên hệ lại với bạn trong thời gian sớm nhất.";
				quickReplies = [{
					content_type: "text",
					title: "Có chứ",
					payload: "confirm",
					image_url: SERVER_URL + "/img/OkLike.png"
				}, {
					content_type: "text",
					title: "Hỗ trợ",
					payload: "help",
					image_url: SERVER_URL + "/img/helps.png"
				},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
				sendQuickMessage(senderID, msg, quickReplies);
				break;
			case 'cbh':
				msg = "Như vậy bạn là một cán bộ Hội LHTN Việt Nam. Chúng ta hãy làm quen với nhau bằng thủ tục điểm danh nhé!";
				sendRegisterForm(senderID, msg);
				break;
			case '63tinh':
				msg = "Như vậy bạn là một cán bộ thuộc 63 tỉnh thành. Chúng ta cùng làm quen bằng thủ tục điểm danh nhé."
				sendRegisterForm(senderID, msg);
				break;
			case 'tt63':
				msg = "Như vậy bạn là một cán bộ thuộc cấp tương đương. Chúng ta cùng làm quen bằng thủ tục điểm danh nhé."
				sendRegisterTempForm(senderID, msg);
				break;
			case 'confirm':
				sendMessageConfimRegister(senderID);
				break;
			case 'bns':
				sendSellProduct(senderID);
				break;
			case 'cfp':
				msg = "Cảm ơn bạn! Hệ thống trung tâm sẽ xử lý và gửi thông báo cho bạn khi tìm được đầu ra cho sản phẩm. Bạn có muốn tiếp tục nói chuyện với Nosa không ?";
				quickReplies = [{
					content_type: "text",
					title: "Có chứ",
					payload: "confirm",
					image_url: SERVER_URL + "/img/OkLike.png"
				}, {
					content_type: "text",
					title: "Hỗ trợ",
					payload: "help",
					image_url: SERVER_URL + "/img/helps.png"
				},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
				sendQuickMessage(senderID, msg, quickReplies);
				break;
			case 'xdth':
				msg = "Một thương hiệu nông sản mạnh cần chứng minh được nguồn gốc xuất xứ, quy trình sản xuất an toàn hoặc chất lượng nông sản. Hãy tham khảo những căn cứ như:";
				sendMessageTrademark(senderID, msg);
				break;
			case 'global gap':
				msg = "GlobalGAP là một bộ tiêu chuẩn về nông trại được công nhận quốc tế dành cho việc thực hành sản xuất nông nghiệp tốt (GAP). Thông qua việc chứng nhận, xác nhà sản xuất chứng minh việc thực hiện tiêu chuẩn GlobalGAP của mình. Đối với người tiêu dùng và các nhà bán lẻ, giấy chứng nhận GlobalGAP là sự đảm bảo rằng thực phẩm đạt được mức độ chấp nhận được về an toàn và chất lượng, và quá trình sản xuất được chứng minh là bền vững và có quan tâm đến sức khỏe, an toàn và phúc lợi của người lao động, môi trường, và có xem xết đến các vấn đề phúc lợi của vật nuôi. Nosa sẽ cập nhật thêm về GlobalGAP sau nhé?";
				sendOneQuick(senderID, msg, "Có chứ", "confirm", "OkLike.png");
				break;
			case 'vietgap':
				msg = "Hãy cùng Nosa tìm hiểu về thủ tục chứng nhận VIETGAP nào!VietGAP có nghĩa là Thực hành sản xuất nông nghiệp tốt ở Việt Nam, do Bộ NNPTNT ban hành đối với từng sản phẩm, nhóm sản phẩm thủy sản, trồng trọt, chăn nuôi.";
				quickReplies = [{
					content_type: "text",
					title: "Lựa chọn tư vấn",
					payload: "lctv",
					image_url: SERVER_URL + "/img/advisory.png"
				}, {
					content_type: "text",
					title: "Quy trình công nhận",
					payload: "qtcn",
					image_url: SERVER_URL + "/img/procedure.png"
				}, {
					content_type: "text",
					title: "Quay lại",
					payload: "confirm",
					image_url: SERVER_URL + "/img/back.png"
				}];
				sendQuickMessage(senderID, msg, quickReplies);
				//saveLogs(objLog);
				break;
			case 'vvsx':
				msg = "Để vay vốn dành cho sản xuất, bạn có thể thực hiện khoản vay 50 triệu từ ngân hàng chính sách. Để tìm hiểu về thủ tục mời bạn download tài liệu sau:";
				sendMessageLoan(senderID, msg);
				break;
			case 'cddl':
				callGetProfile(senderID, function (profile) {
					var obj = JSON.parse(profile);
					msg = 'Hmmm, cụm từ "Chỉ dẫn địa lý" nghe giống như bạn đang đi hỏi đường ấy nhỉ. :). Nhưng thực ra cụm từ này là tiêu chuẩn của một sản phẩm. Chỉ dẫn địa lý là thông tin về nguồn gốc của hàng hóa: từ ngữ, dấu hiệu, biểu tượng, hình ảnh để chỉ: một quốc gia, một vùng lãnh thổ, một địa phương mà hàng hóa được sản xuất ra từ đó. Chất lượng, uy tín, danh tiếng của hàng hóa là do nguồn gốc địa lý tạo nên.' + obj['last_name'] + ' ' + obj['first_name'] + ' có biết hiện tại ở Việt Nam có bao nhiêu chỉ dẫn địa lý được bảo hộ không?';
					quickReplies = [{
						content_type: "text",
						title: "46",
						payload: "cddl66",
						image_url: SERVER_URL + "/img/OkLike.png"
					}, {
						content_type: "text",
						title: "56",
						payload: "cddl66",
						image_url: SERVER_URL + "/img/OkLike.png"
					}, {
						content_type: "text",
						title: "66",
						payload: "cddl66",
						image_url: SERVER_URL + "/img/OkLike.png"
					}];
					sendQuickMessage(senderID, msg, quickReplies);
				});
				break;
			case 'cddl66':
				msg = "Đáp án chính xác là 66. Để Nosa giúp bạn hiểu rõ hơn về con số này nhé. Tính đến T3/2018, Việt Nam đã bảo hộ 66 chỉ dẫn địa lý với khoảng 1.000 sản vật, trong đó có 60 chỉ dẫn địa lý của Việt Nam và 6 chỉ dẫn địa lý của nước ngoài. Nghe thì hơi phức tạp nhưng chắc bạn đã nghe đến cụm từ như: Cam Cao Phong, Sò huyết Ô Loan, Nước mắm Phú Quốc, Nhãn lồng Hưng Yên, Thuốc lào Vĩnh Bảo . . .hay những tên mới như Thịt cừu Ninh Thuận, Cà phê Sơn La . . .Đây chính là chỉ dẫn địa lý bạn ạ.";

				sendOneQuick(senderID, msg, "Xem thủ tục đăng ký", "vcddl", "OkLike.png");
				break;
			case 'vcddl':
				msg = "Hướng dẫn :";
				file_loc = __dirname + "/public/img/cddl.png";
				sendFileMessage(senderID, msg, "image", file_loc);
				break;
			case 'nd612015ndcp':
				msg = "Hướng dẫn :";
				file_loc = __dirname + "/public/img/nd612015ndcp.png";
				sendFileMessage(senderID, msg, "image", file_loc);
				break;
			case 'ncvv':
				msg = "Tính năng đang được xây dựng, bạn có muốn tiếp tục nói chuyện với Nosa không ?";
				quickReplies = [{
					content_type: "text",
					title: "Có chứ",
					payload: "confirm",
					image_url: SERVER_URL + "/img/OkLike.png"
				}, {
					content_type: "text",
					title: "Hỗ trợ",
					payload: "help",
					image_url: SERVER_URL + "/img/helps.png"
				},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
				sendQuickMessage(senderID, msg, quickReplies);
				break;
			case 'qtcn':
				msg = "Hướng dẫn :";
				//sendTextMessage(senderID,msg);
				file_loc = __dirname + "/public/img/QTCN.png";
				sendFileMessage(senderID, msg, "image", file_loc);
				break;
			case 'lctv':
				msg = "Hướng dẫn :";
				file_loc = __dirname + "/public/img/LCTV-P1.jpg";
				sendFileMessage(senderID, msg, "image", file_loc);
				break;
			case 'ksvyes':
				sendKSV(senderID);
				break;
			case 'ksvno':
				msg = "Tính năng xác thực Hội viên chỉ mở cho những Hội viên đã được xác thực trước đó, vui lòng liên hệ cán bộ Hội cấp trên để được xác thực nhé!";
				quickReplies = [{
					content_type: "text",
					title: "Đồng ý",
					payload: "confirm",
					image_url: SERVER_URL + "/img/OkLike.png"
				}, {
					content_type: "text",
					title: "Hỗ trợ",
					payload: "help",
					image_url: SERVER_URL + "/img/helps.png"
				},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
				sendQuickMessage(senderID, msg, quickReplies);
				break;
			case 'hdlda':
				msg = "Hướng dẫn đang được cập nhật. Bạn có muốn tiếp tục trò truyện với Nosa không ?";
				quickReplies = [{
					content_type: "text",
					title: "Có chứ",
					payload: "confirm",
					image_url: SERVER_URL + "/img/OkLike.png"
				}, {
					content_type: "text",
					title: "Hỗ trợ",
					payload: "help",
					image_url: SERVER_URL + "/img/helps.png"
				},{
					content_type: "text",
					title: "Hướng dẫn",
					payload: "guide",
					image_url: SERVER_URL + "/img/guide.png"
				}];
				sendQuickMessage(senderID, msg, quickReplies);
				break;
			case 'help':
				msg = "Để được hỗ trợ Nosa cần bạn điền thông tin theo mẫu sau:";
				var button = [{
					type: "web_url",
					url: SERVER_URL + "/help.bot",
					title: "Điền thông tin",
					messenger_extensions: true,
					webview_height_ratio: "tall",
					fallback_url: SERVER_URL + "/help.bot"
				}];
				sendButtonMessage(senderID, msg, button);
				break;
			case 'guide':
				sendGuide(senderID);
				break;
			default:
				sendTextMessage(senderID, 'Echo :' + messageText);
		}

		return;
	}

	if (messageText) {
		// If we receive a text message, check to see if it matches any special
		// keywords and send back the corresponding example. Otherwise, just echo
		// the text we received.	
		var mydate = new Date();
		var inputDate = new Date(mydate.toISOString());
		var objLog = {
			"SenderID": senderID,
			"Question": messageText,
			"Answer": msg,
			"InsertDay": inputDate
		};
		switch (messageText.toLowerCase()) {
			case 'image':
				//sendImageMessage(senderID);
				break;
			case 'restart':
				callGetProfile(senderID, function (profile) {
					console.log("Get profile: ", profile);
					var obj = JSON.parse(profile);
					msg = "Chúc mừng " + obj["last_name"] + " " + obj["first_name"] + " đã kết nối vào hệ thống!";
					objLog.Answer = msg;
					//saveLogs(objLog);
					sendMessageWelecome(senderID, msg);
				});
				break;
			case 'bắt đầu':
				callGetProfile(senderID, function (profile) {
					//console.log("Res Post facebook 3", profile);
					var obj = JSON.parse(profile);
					msg = "Chúc mừng " + obj["last_name"] + " " + obj["first_name"] + " đã kết nối vào hệ thống!";
					objLog.Answer = msg;
					//saveLogs(objLog);
					sendMessageWelecome(senderID, msg);
				});
				break;
			case 'help':
				callGetProfile(senderID, function (profile) {
					//console.log("Res Post facebook 3", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " đã liên hệ !";
					objLog.Answer = msg;
					//saveLogs(objLog);
					sendMessageWelecome(senderID, msg);
				});
				break;
			case 'giúp đỡ':
				callGetProfile(senderID, function (profile) {
					//console.log("Res Post facebook 3", profile);
					var obj = JSON.parse(profile);
					msg = obj["last_name"] + " " + obj["first_name"] + " đã liên hệ!";
					objLog.Answer = msg;
					//saveLogs(objLog);
					sendMessageWelecome(senderID, msg);
				});
				break;
			case 'điểm danh':
				callGetProfile(senderID, function (profile) {
					//console.log("Res Post facebook 3", profile);
					var obj = JSON.parse(profile);
					msg = "Chúc mừng " + obj["last_name"] + " " + obj["first_name"] + " đã kết nối vào hệ thống!";
					objLog.Answer = msg;
					//saveLogs(objLog);
					sendMessageWelecome(senderID, msg);
				});
				break;
			case 'cán bộ đoàn':
				msg = "Như vậy bạn là một cán bộ đoàn. Chúng ta cùng làm quen bằng thủ tục điểm danh nhé!";
				objLog.Answer = msg;
				sendRegisterForm(senderID, msg);
				break;
			case 'cán bộ hội':
				msg = "Như vậy bạn là một cán bộ hội. Chúng ta cùng làm quen bằng thủ tục điểm danh nhé!";
				objLog.Answer = msg;
				//saveLogs(objLog);
				sendRegisterForm(senderID, msg);
				break;
			case 'chuẩn':
				sendMessageConfimRegister(senderID);
				break;
			case 'bán nông sản':
				//msg = "Đầu ra cho sản phẩm luôn là một vấn đề phức tạp. Để nhận được sự tư vấn về đầu ra cho nông sản bạn hãy cung cấp thông tin vào form dưới nhé!";
				sendSellProduct(senderID);
				//objLog.Answer=msg;
				//saveLogs(objLog);
				break;
			case 'chỉ dẫn địa lý':
				msg = "Hướng dẫn :";
				//sendTextMessage(senderID,msg);
				file_loc = __dirname + "/public/img/cddl.png";
				//console.log("file_loc:",file_loc)
				sendFileMessage(senderID, msg, "image", file_loc);
				//objLog.Answer=msg;
				//saveLogs(objLog);
				break;
			case 'xây dựng thương hiệu':
				msg = "Một thương hiệu nông sản mạnh cần chứng minh được các chỉ số về nguồn gốc xuất xứ, quy trình sản xuất an toàn hoạc chất lượng nông sản. Hãy tham khảo các căn cứ như.";
				sendMessageTrademark(senderID, msg);
				objLog.Answer = msg;
				//saveLogs(objLog);
				break;
			case 'ksv':
				sendKSV(senderID);
				break;
			case 'vay vốn':
				msg = "Để vay vốn dành cho sản xuất, bạn có thể thực hiện khoản vay 50 triệu từ ngân hàng chính sách. Để tìm hiểu về thủ tục mời bạn download tài liệu sau:";
				sendMessageLoan(senderID, msg);
				objLog.Answer = msg;
				//saveLogs(objLog);
				break;
			case 'thông tin':
				sendInfo(senderID);
				break;

			case '#setadmin':
				setAdmin(senderID);
				break;
			case 'uqksv':
				sendUqKsv(senderID);
				break;
			case 'hướng dẫn':
				sendGuide(senderID);
				break;
			case 'qr':
				var url = "https://scontent.fhan3-2.fna.fbcdn.net/v/t1.0-9/37013371_201626787167096_4150509129015754752_n.png?_nc_cat=0&oh=79f3bc7ccdb642fd252bd84aa909e80c&oe=5BA3D6F4";
				var msg = "Bạn có muốn tiếp tục nói chuyện với Nosa không ?"
				sendUrlMessage(senderID, "image", url, function (error, response, bd) {
					if (error) throw error;
					console.log("sendUrlMessage:");

					var quickReplies = [{
						content_type: "text",
						title: "Có chứ",
						payload: "confirm",
						image_url: SERVER_URL + "/img/OkLike.png"
					},{
						content_type: "text",
						title: "Hỗ trợ",
						payload: "help",
						image_url: SERVER_URL + "/img/helps.png"
					},{
						content_type: "text",
						title: "Hướng dẫn",
						payload: "guide",
						image_url: SERVER_URL + "/img/guide.png"
					}];
					sendQuickMessage(senderID, msg, quickReplies);

				});
				break;
			default:
				getAnswer(messageText, function (aiMes) {
					if (aiMes.length > 0) {
						//console.log("GetAnswer 2:", aiMes[0].Answer);
						//var obj = JSON.parse(profile);
						//var msg = "Chúc mừng " + obj["last_name"] + " " + obj["first_name"] + " đã kết nối vào hệ thống!";
						//sendTextMessage(senderID, 'Echo:' + messageText);
						msg = aiMes[0].Answer;
						objLog.Answer = msg;
						saveLogs(objLog);
						//sendTextMessage(senderID,msg);
						msg = msg + ". Bạn có muốn tiếp tục nói chuyện với Nosa không ?";
						quickReplies = [{
							content_type: "text",
							title: "Có chứ",
							payload: "confirm",
							image_url: SERVER_URL + "/img/OkLike.png"
						}, {
							content_type: "text",
							title: "Hỗ trợ",
							payload: "help",
							image_url: SERVER_URL + "/img/helps.png"
						},{
							content_type: "text",
							title: "Hướng dẫn",
							payload: "guide",
							image_url: SERVER_URL + "/img/guide.png"
						}];
						sendQuickMessage(senderID, msg, quickReplies);
					} else {
						sendNoReply(senderID);

					}
				});
				break;

		}



	} else if (messageAttachments) {
		sendTextMessage(senderID, "Message with attachment received");
	}
}

//////WebView Facebook

function setupGreetingText(res) {
	var messageData = {
		"greeting": [{
			"locale": "default",
			"text": "Chúc mừng bạn đã kết nối vào hệ thống !"
		}, {
			"locale": "en_US",
			"text": "Welecom"
		}]
	};
	request({
			url: 'https://graph.facebook.com/v3.0/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			form: messageData
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				console.log("setupGreetingText:", body);

			} else {
				// TODO: Handle errors
				console.log("setupGreetingText:", body);
			}
		});

}

function setupPersistentMenu(res) {
	var messageData = {
		"persistent_menu": [{
			"locale": "default",
			composer_input_disabled: false,
			"call_to_actions": [{
				"title": "Hỗ trợ",
				"type": "nested",
				"call_to_actions": [{
					"title": "Điểm danh",
					"type": "postback",
					"payload": "Điểm danh"
				}, {
					"type": "web_url",
					"title": "Trang chủ",
					"url": "https://www.kyc.net.vn",
					"webview_height_ratio": "full"
				}]
			}]
		}]
	};
	// Start the request
	request({
			url: "https://graph.facebook.com/v3.0/me/messenger_profile?access_token=" + PAGE_ACCESS_TOKEN,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			form: messageData
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				res.send(body);

			} else {
				// TODO: Handle errors
				res.send(body);
			}
		});

};

function setupGetStartedButton(res) {
	var messageData = {
		"get_started": {
			"payload": "getstarted"
		}
	};
	// Start the request
	request({
			url: "https://graph.facebook.com/v3.0/me/messenger_profile?access_token=" + PAGE_ACCESS_TOKEN,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			form: messageData
		},
		function (error, response, body) {
			if (!error && response.statusCode == 200) {
				// Print out the response body
				console.log("setupGetStartedButton:", body);

			} else {
				// TODO: Handle errors
				console.log("setupGetStartedButton:", body);
			}
		});
};

function writeFile(fileName, data, newPath, psid, callback) {

	console.log("writeFile: writeFile : ", newPath + "/" + fileName);
	try {
		var buf = new Buffer(data, 'base64');
		console.log("writeFile: read buf");
		var res;
		fs.writeFile(newPath + "/" + fileName, buf, function (err) {
			if (err) {
				console.log("writeFile error :", err);
				callback(err, res);
			} else {
				console.log('File is uploaded :', newPath + "/" + fileName);
				cloudinary.v2.uploader.upload(newPath + "/" + fileName, {
						public_id: "Avatar/" + psid
					},
					function (error, result) {

						fs.unlink(newPath + "/" + fileName, function (error) {
							if (error) {
								console.log("cloudinary.v2.uploader :", error);
							}
							console.log('Deleted : ', newPath + "/" + fileName);
						});
						callback(error, result);
						console.log("Cloudinary:", result)
					});
			}
		});
	} catch (err) {

		console.error("writeFile:", err);
	}

};

function writeFileProduct(fileName, data, newPath, psid, callback) {
	console.log("writeFileProduct: writeFile", newPath + "/" + fileName);
	try {
		var buf = new Buffer(data, 'base64');
		console.log("writeFileProduct: read buf");
		var res;
		fs.writeFile(newPath + "/" + fileName, buf, function (err) {
			if (err) {
				console.log("writeFileProduct error :", err);
				callback(err, res);
			} else {

				console.log('File is uploaded :', newPath + "/" + fileName);
				cloudinary.v2.uploader.upload(newPath + "/" + fileName, {
						public_id: "Product/" + fileName.replace('.', '')
					},
					function (error, result) {

						fs.unlink(newPath + "/" + fileName, function (error) {
							if (error) {
								console.log("writeFileProduct cloudinary.v2.uploader error :", error);
							}
							console.log('Deleted : ', newPath + "/" + fileName);
						});
						callback(error, result);
						console.log("Cloudinary:", result)
					});
			}
		});
	} catch (err) {

		console.error("writeFileProduct:", err);
	}

};
////// Mở port lắng nghe 
// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
server.listen(server.get('port'), function () {
	console.log('Node app is running on port ', server.get('port'));
});

module.exports = server;
