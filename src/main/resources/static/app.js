function activate() {
  var mobileFormData = JSON.stringify({
    'mobile': $("#mobile").val(),
  });

  console.log("Activating...");
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/api/auth/getcode",
    data: mobileFormData,
    contentType: "application/json;charset=utf-8",
    success: function(result) {
        $("#activationCode").val(result.activationCode);
    },
    error: function(xhr, status, error) {
        console.error("Activation error:", status, error);
        alert("Failed to get activation code. Please try again.");
    }
  });
}

function login() {
  var loginFormData = JSON.stringify({
    'mobile': $("#mobile").val(),
    'activationCode': $("#activationCode").val(),
  });

  console.log("Logging in...");
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/api/auth/login",
    data: loginFormData,
    contentType: "application/json;charset=utf-8",
    success: function(result) {
        $("#accessToken").val(result.accessToken);
        console.log("Login successful.");
    },
    error: function(xhr, status, error) {
        console.error("Login error:", status, error);
        alert("Login failed. Please check your credentials and try again.");
    }
  });
}

function loadContacts() {
  var getcontactsFormData = JSON.stringify({
    'accessToken': $("#accessToken").val(),
  });

  $("#contactlist").empty();
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/api/auth/getcontacts",
    data: getcontactsFormData,
    contentType: "application/json;charset=utf-8",
    success: function(result) {
        console.log("Contacts loaded:", JSON.stringify(result));
        result.contacts.forEach(function(c) {
            $("#contactlist").append('<tr><td><input type="checkbox" name="sendTo" value="' + c.contactUserId + '">' + c.user.mobile + '</input></td></tr>');
        });
    },
    error: function(xhr, status, error) {
        console.error("Error loading contacts:", status, error);
        alert("Failed to load contacts. Please try again.");
    }
  });
}

var ws;
function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        loadContacts();
        $("#chatbox").show();
    } else {
        $("#chatbox").hide();
    }
}

function connect() {
    var accessToken = $("#accessToken").val();
    if (!accessToken) {
        alert("Please login to obtain an access token.");
        return;
    }

    ws = new WebSocket('ws://localhost:8080/messaging?accessToken=' + accessToken);

    ws.addEventListener('open', function(event) {
        console.log("WebSocket connection established.");
        setConnected(true);
    });

    ws.addEventListener('error', function(error) {
        console.error("WebSocket error:", error.message);
        setConnected(false);
        alert("WebSocket connection failed.");
    });

    ws.addEventListener('close', function(event) {
        console.log("WebSocket closed:", event.code, event.reason);
        setConnected(false);
    });

    ws.onmessage = function(event) {
        console.log("Message received from WebSocket:", event.data);
        helloWorld(event.data);
    };
}

function disconnect() {
    if (ws) {
        ws.close();
    }
    setConnected(false);
    console.log("WebSocket disconnected.");
}

function sendData() {
    var data = JSON.stringify({
        'topic': 'SEND_MESSAGE',
        'message': {
            'accessToken': $("#accessToken").val(),
            'sendTo': $("#sendTo").val(),
            'msg': $("#messageArea").val(),
        }
    });

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        console.log("Data sent:", data);
    } else {
        alert("WebSocket is not connected.");
    }
}

function helloWorld(message) {
    $("#chatmessages").append("<tr><td>" + message + "</td></tr>");
}

$(function() {
    $("form").on('submit', function(e) {
        e.preventDefault();
    });

    $("#activate").click(function() {
        activate();
    });

    $("#login").click(function() {
        login();
    });

    $("#connect").click(function() {
        connect();
    });

    $("#disconnect").click(function() {
        disconnect();
    });

    $("#send").click(function() {
        sendData();
    });
});

