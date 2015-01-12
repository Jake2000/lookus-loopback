module.exports = function(app) {
  //var Message = app.models.message;

  //var remotes = app.remotes('message').classes('message');

  //console.log(app.remotes()._classes.message._methods);

  //console.log(app.remotes().findMethod('message.create'));

  app.remotes().findMethod('message.create').notes = "" +
  "Есть два варианта создания сообщений:<br>" +
  "1) указывая 'recipient_id' - диалог автоматически создается, или ищется тет-а-тет диалог между двумя пользователями,"+
  " в созданный диалог нельзя никого прикласить<br>" +
  "2) указывая 'dialog_id' - сообщение прикрепляется к диалогу";

  //console.log(app.remotes().findMethod('message.create').sharedCtor);

  //console.log(Message.create);

  //app.loopback.remoteMethod(Message.create, {
  //  description: 'Create a new instance of the model and persist it into the data source',
  //  notes: "Есть два варианта создания сообщений:<br>" +
  //  "1) указывая 'recipient_id' - диалог автоматически создается, или ищется тет-а-тет диалог между двумя пользователями,"+
  //  " в созданный диалог нельзя никого прикласить<br>" +
  //  "2) указывая 'dialog_id' - сообщение прикрепляется к диалогу",
  //  accessType: 'WRITE',
  //  accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
  //  returns: {arg: 'data', type: 'message', root: true},
  //  http: {verb: 'post', path: '/'}
  //});
};
