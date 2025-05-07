function toggleSignIn() {
	$("#signin-section").toggle();
	if ($("#signup-section").is(":visible")) {
		$("#signup-section").hide();
	}
}

function toggleSignUp() {
	$("#signup-section").toggle();
	if ($("#signin-section").is(":visible")) {
		$("#signin-section").hide();
	}
}

function InvalidCredentialsError(err) {
	// TODO
}

$(document).ready(function () {
	// Sign-in
	$("#signin-form").on("submit", function (e) {
		e.preventDefault();
		const username = $("#username").val();
		const password = $("#password").val();

		$("#password").val("");

		if (!username || !password) {
			return;
		}

		$.ajax({
			url: "/signin",
			method: "POST",
			contentType: "application/json",
			data: JSON.stringify({ username, password }),
			success: function (res) {
				toggleSignIn();
				$("#signin-button").hide();
				$("#signout-button").show();
				$("#player-name").text(res.username);
				$("#player-info").show();
				$("#game-room").show();
			},
			error: function (err) {
				InvalidCredentialsError(err);
			}
		})
	})

	// Sign-up
	$("#signup-form").on("submit", function (e) {
		e.preventDefault();
		const username = $("#new-username").val();
		const password = $("#new-password").val();

		if (!username || !password) {
			return;
		}
		$("#new-password").val("");

		$.ajax({
			url: "/signup",
			method: "POST",
			contentType: "application/json",
			data: JSON.stringify({ username, password }),
			success: function () {
				toggleSignUp();
				$("#signin-button").hide();
				$("#signout-button").show();
				$("#player-name").text(username);
				$("#player-info").show();
				$("#game-room").show();
			},
			error: function (err) {
				InvalidCredentialsError(err);
			}
		})
	})

	// Sign-out
	$("#signout-button").on("click", function () {
        $.ajax({
            url: "/signout",
            method: "POST",
            success: function () {
                $("#signin-button").show();
                $("#signout-button").hide();
                $("#player-info").hide();
				$("#game-room").hide();
                $("#player-name").text("Null");
            },
            error: function (err) {
                alert("Error logging out: " + err.responseText);
            }
        });
    });

	// Session
	$.ajax({
        url: "/session",
        method: "GET",
        success: function (res) {
            if (res.username) {
                $("#signin-button").hide();
                $("#signout-button").show();
                $("#player-name").text(res.username);
                $("#player-info").show();
				$("#game-room").show();
            }
        },
        error: function () {
            $("#signin-button").show();
            $("#signout-button").hide();
            $("#player-info").hide();
            $("#player-name").text("Null");
        }
    });
});