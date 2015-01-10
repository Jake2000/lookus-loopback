var loopback = require('loopback');

module.exports = function(Message) {

  var createOrDialog = function(message, cb) {

  };

  Message.beforeSave = function(next, modelInstance) {

    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    if(!currentUser) {
      var err = new Error('Access Exception');
      err.status = 403;
      err.errorCode = 40301;
      console.log('currentUserNotFound');
      console.log('currentUserNotFound');
      return next(err);
    }
    console.log('currentUser.username: ', currentUser.username); // voila!
    console.log('currentUser.id: ', currentUser.id);

    modelInstance.sender(currentUser);

    //if dialog is passed from client
    if(modelInstance.dialog_id) {
      currentUser.dialogs.findById(modelInstance.dialog_id, function(err, dialog) {
        //TODO
      });
    } else if (modelInstance.recipient_id) {
      //fetching recipient
      Message.app.models.user.findById(modelInstance.recipient_id, function(err, recipient) {
        //TODO
      });
    } else {
      var err1 = new Error('You should specify recipient_id or dialog_id to post a message');
      err1.status = 422;
      err1.errorCode = 42203;
      return next(err1);
    }

    next();
  };

  Message.afterSave = function(next) {
    //creating dialog
    var message = this;
    Message.app.models.dialog.create({
      title: message.subject || ""
    }, function(err, dialog) {
      if(err) {
        console.log(err);
        return next();
      } else if(dialog) {

        //setting dialog
        dialog.messages.add(message);

        //setting
      } else {
        return;
      }
    });
    next();
  };


  Message.disableRemoteMethod('upsert', true);
  Message.disableRemoteMethod('update', true);
  Message.disableRemoteMethod('updateAll', true);
  Message.disableRemoteMethod('exists', true);
  Message.disableRemoteMethod('findOne', true);
  Message.disableRemoteMethod('find', true);
};
