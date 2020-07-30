$("#awaiting-confirmation").hide();
$("#confirmation-sent").hide();
$("#email-validation").hide();
$("#invalid-email").hide();

$("#enter").click(function() {

    if (emailValidation()) {
        $("#email-validation").hide();
        $("#form-input").hide(200, "swing");

        $("#awaiting-confirmation").show(200);


        $.post("/newemail", {
                email: $("#email-input").val()
            },
            function(data, status) {

                $("#awaiting-confirmation").hide(200);

                if (data.status === 200) {
                    $("#confirmation-sent").show(200);
                    $("#form").toggleClass("green");
                    setTimeout(
                        function() {
                            $("#form").toggleClass("green");
                        }, 3000);
                } else {
                    $("#invalid-email").show(200);
                }
            });




    } else {
        $("#email-validation").show(200);
    }

});


function emailValidation() {
    let email = $("#email-input").val();
    if (email.includes("@")) {
        return true;
    } else {
        return false;
    }
}