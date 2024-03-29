module.exports = function(app) {
  app.remotes().findMethod('message.create').notes = "" +
    "Есть два варианта создания сообщений:<br>" +
    "1) указывая 'recipient_id' - диалог автоматически создается, или происходит поиск тет-а-тет диалога между двумя пользователями," +
    " в созданный диалог нельзя никого прикласить<br>" +
    "2) указывая 'dialog_id' - сообщение прикрепляется к диалогу";

  app.remotes().findMethod('message.create').accepts = [{arg: 'data', type: 'messageModelEditable', http: {source: 'body'}}];
};
