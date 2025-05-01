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