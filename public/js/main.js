// Toggle dark - light theme

$("#change-theme-btn").click(function() {
    $("body").toggleClass("dark");
    if ($('body').hasClass('dark')) {
        $("#change-theme-btn").text("🌞")
    } else {
        $("#change-theme-btn").text("🌘");
    }
});



// Toggle project filters

$(".key-holder").click(function() {
    $(this).toggleClass($(this).attr('id'));
    $(".project-holder." + $(this).attr('id')).toggle("hidden");
});