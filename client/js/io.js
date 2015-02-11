var host = window.location.host;

console.log(host);

if(host.indexOf('localhost') >=0) {
  host = 'localhost:3302';
} else {
  host = 'ws.'+window.location.host;
}
var socket = io.connect(host);

socket.on('welcome', function(data) {
  socket.emit('i am client', {data: 'foo!'});
});
socket.on('msg', function(data) {
  $('#ws-messages').append('<li class="list-group-item"><span class="glyphicon glyphicon-download" aria-hidden="true"></span>&nbsp;' + data.text + '</li>');
});
socket.on('error', function() { console.error(arguments) });
socket.on('message', function() { console.log(arguments) });

$(function(){

  $('#send-ws-message').on('click', function() {
    socket.emit('msg', {text: $('#ws-message').val()});
    $('#ws-messages').append('<li class="list-group-item"><span class="glyphicon glyphicon-upload" aria-hidden="true"></span>&nbsp;' + $('#ws-message').val() + '</li>');
    $('#ws-message').val('');
  });
});
