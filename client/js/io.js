
var socket = io.connect(window.location.host);

socket.on('welcome', function(data) {
  socket.emit('i am client', {data: 'foo!'});
});
socket.on('msg', function(data) {
  $('#ws-messages').append('<li>' + 'received:' + data.text + '</li>');
});
socket.on('error', function() { console.error(arguments) });
socket.on('message', function() { console.log(arguments) });

$(function(){

  $('#send-ws-message').on('click', function() {
    socket.emit('msg', {text: $('#ws-message').val()});
    $('#ws-messages').append('<li>' + 'sent:' + $('#ws-message').val() + '</li>');
    $('#ws-message').val('');
  });
});
