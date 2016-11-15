var ws;
var user = { name: 'Mario'};
var sector; // MY own sector (aka level)
var interval;
var DEBUG = true;

var img = document.createElement("img");
img.src = "images/mario-stamp.png";

$('#multiplayer-name').keyup(function(){
      user.name = $(this).val();
 });
function drawName (ctx, name, x, y ) {
  ctx.font="10px Arial";
  ctx.fillStyle = 'white';
  ctx.fillText(name, x, y);
}
function drawMultiplayer(ctx) {

  if (!sector) return;

   var level = nes.cpu.mem[0x0760];
   var world = nes.cpu.mem[0x075F];

   drawName(ctx, user.name, nes.cpu.mem[0x0755], nes.cpu.mem[0x00CE]);

  for(var i =0 ; i < sector.users.length; i++){

    var u = sector.users[i];
    //Skip drawing my own user
    if (u.id == user.id) continue;

    var position = u.position;

    var cameraX = nes.cpu.mem[0x071A] * 255 + nes.cpu.mem[0x071C];
    var positionX =  position[0] - cameraX;
    ctx.drawImage(img,positionX, position[1] +16, 18, 18);

    drawName(ctx, u.name, positionX, position[1]);

  /*  // Draw myself
  var cameraX = nes.cpu.mem[0x071A] * 255 + nes.cpu.mem[0x071C];
    var positionX = nes.cpu.mem[0x0755];
    var x = cameraX + positionX;
    var y = nes.cpu.mem[0x00CE];
    ctx.drawImage(img,positionX, y +16, 18, 18);*/
  }

}
function connect() {
   if ("WebSocket" in window) {
      log("Opening websocket!");
      ws = new WebSocket("ws://localhost:8001/");

      ws.onopen = function(){
         log("Connection opened !!");

         interval= setInterval(function(){

           var level = nes.cpu.mem[0x0760];
           var world = nes.cpu.mem[0x075F];

           var cameraX = nes.cpu.mem[0x071A] * 255 + nes.cpu.mem[0x071C];
           var positionX = nes.cpu.mem[0x0755];
           var x = cameraX + positionX;
           var y = nes.cpu.mem[0x00CE];
          // ctx.drawImage(img,positionX -16, y -16, 32, 32);

           user.position = [x,y]; // x, y
           user.level  =  [world, level];

           sendJson({
             type: 'update',
             user: user,
           });
         }, 10);

      };

      ws.onmessage = function (evt){
      //  log("Message received: " + evt.data);
        try {
           var json = JSON.parse(evt.data);
           switch(json.type) {
             case 'connection':
                 user.id = json.id;
                 break;
             case 'update':
                 sector = json.sector;
                //console.log("sector ", sector);
                 break;
             default: log("Message not recognized " + evt.data);
           }
         } catch (e){
           log("Unable to parse evt  "+evt.data+ ": "+ e);
         }
      };

      ws.onclose = function() {
        log("Connection is closed.");

        clearInterval(interval);
         setTimeout(function(){
           log("Reconnecting websocket.");
           connect();
         }, 1000);
      };
   } else log("WebSocket NOT supported by your Browser!");
}


function log(text){
  if (DEBUG) console.log(text);
  //$("#log").append(text+"\n");
}
function sendJson(json){
  //json.connection = connectionId;
  //console.log("Sending",json);
  ws.send(JSON.stringify(json));
}

connect();
