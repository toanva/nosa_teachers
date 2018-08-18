
var txtFullName = document.getElementById("txtFullName");
var txtDay = document.getElementById("txtBirthday");
var txtPhone = document.getElementById('txtPhone');
var txtCMT = document.getElementById('txtCMT');
var txtAddress = document.getElementById('txtAddress'); 
var txtDocument = document.getElementById('txtDocument');
var btnSend = document.getElementById('btnSend');

function SaveObject() {
	btnSend.disabled = true;
	btnSend.style.color = '#5d98fb';
	var psid;
	if(document.getElementById("psid").value!="" && document.getElementById("psid").value!=undefined)
	{
		psid = document.getElementById("psid").value;
	}else
	{
		psid= getParamValue("psid");
	}

	if (txtFullName.value == undefined || txtFullName.value == "") {
		alert("Bạn phải nhập tên");
		btnSend.disabled = false;
		btnSend.style.color = '#FFFFFF';
		txtFullName.focus();
		return;
	};

	if (txtPhone.value == undefined || txtPhone.value == "") {
		alert("Bạn phải nhập số ĐT");
		btnSend.disabled = false;
		btnSend.style.color = '#FFFFFF';
		txtPhone.focus();
		return;
	};
	if (txtEmail.value == undefined || txtEmail.value == "") {
		alert("Bạn phải nhập Email");
		btnSend.disabled = false;
		btnSend.style.color = '#FFFFFF';
		txtEmail.focus();
		return;
	};
	var mydate = txtBirthday.valueAsDate;
	var inputDate = new Date(mydate.toISOString());

	var objMember = {};
	objMember.psid = psid;
	objMember.Name = txtFullName.value;
	objMember.Birthday =  mydate.getDate()+'/'+(mydate.getMonth()+1)+'/'+mydate.getFullYear();
	objMember.Phone = txtPhone.value;
    objMember.CMT = txtCMT.value;
    objMember.Address = txtAddress.value;
	var form = new FormData();
	form.append('psid', objMember.psid);
	form.append('Name', objMember.Name);
	form.append('Birthday', objMember.Birthday);
    form.append('Address', objMember.Address);
    form.append('CMT', objMember.CMT);
	form.append('Phone', objMember.Phone);
	$.ajax({
		type: 'POST',
		data: form,
		contentType: false,
		processData: false,
		url: '/senddocument',
		success: function (data) {
			btnSend.disabled = false;
			btnSend.style.color = '#FFFFFF';
			console.log(data);
			alert("Thêm mới thành công");
			MessengerExtensions.requestCloseBrowser(function success() {
				console.log("Webview closing");
			}, function error(err) {
				console.log("getElementById Err:" + err);
			});

		},
		error: function (err) {
			btnSend.disabled = false;
			btnSend.style.color = '#FFFFFF';
			alert("Lỗi :", err);
		}
	});

};
