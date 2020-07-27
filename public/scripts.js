$("#succesful").hide();

$("#enter").click(function(){
    $("form").children().hide(200, "swing");
    $("#succesful").show(200);
    $("form").toggleClass("green");
    setTimeout(
  function() 
  {
    $("form").toggleClass("green");
  }, 3000);
});