var loopback = require('loopback');

module.exports = function(Message) {

  Message.beforeSave = function(next, modelInstance) {

    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    if(!currentUser) {
      next();
    }
    console.log('currentUser.username: ', currentUser.username); // voila!
    console.log('currentUser.id: ', currentUser.id);

    modelInstance.sender(currentUser);

    //if dialog is passed from client
    if(modelInstance.dialog_id) {
      Message.dialog.findById(modelInstance.dialog_id, function(err, dialog) {

      });
    } else if (modelInstance.recipient_id) {
      Message.dialog.create({
        title: modelInstance.subject || ""
      }, function(err, dialog) {
        dialog.users.add(currentUser);
      });
    } else {
      var err = new Error('You should specify recipient_id or dialog_id to post a message');
      err.status = 422;
      err.errorCode = 42203;
      next(err);
      return;
    }

    next();
  };


  Message.disableRemoteMethod('upsert', true);
  Message.disableRemoteMethod('update', true);
  Message.disableRemoteMethod('updateAll', true);
  Message.disableRemoteMethod('exists', true);
  Message.disableRemoteMethod('findOne', true);
  Message.disableRemoteMethod('find', true);
};
