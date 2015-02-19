var loopback = require('loopback');
var app = require('./../../server/server');
var _ = require('lodash');
var noop = function() {};

module.exports = function(Message) {

  var findDialogByParticipants = function(sender_id, recipient_id, cb) {
    app.models.dialog.findOne({where: {
      is_grouped: false,
      or: [{and: [{private_participant_1_id: sender_id}, {private_participant_2_id: recipient_id}]},
        {and: [{private_participant_2_id: sender_id}, {private_participant_1_id: recipient_id}]}]
    }}, function(err, dialog) {
      cb(err, dialog);
    });
  };

  Message.beforeCreate = function(next, modelInstance) {

    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    if(!currentUser) {
      var err = new Error('Access Exception');
      err.status = 403;
      err.errorCode = 40301;
      return next(err);
    }

    // Setting is_read flag to false
    modelInstance.is_read = false;
    modelInstance.created = Date.now();
    modelInstance.updated = Date.now();

    // Setting message sender
    modelInstance.sender(currentUser);

    if(modelInstance.dialog_id) {   // If dialog is passed from client
      // Check that dialog exists
      currentUser.dialogs.findById(modelInstance.dialog_id, function(err, dialog) {
        if(!dialog) {
          var err1 = new Error('Dialog with id \''+modelInstance.dialog_id+'\' not found');
          err1.status = 422;
          err1.errorCode = 42204;
          return next(err1);
        }

        // link
        modelInstance.dialog(dialog);

        // Search all participants (check that we can write to that dialog)
        // Note: we don't need it here
        // app.models.dialogUser.exists({dialog_id: dialog.id, user_id: })

        next();
      });
    } else if (modelInstance.recipient_id) {  // If recipient is passed from client

      //fetching recipient
      app.models.user.findById(modelInstance.recipient_id, function(err, recipient) {
        if(!recipient) {
          var err1 = new Error('Recipient with id \''+modelInstance.recipient_id+'\' not found');
          err1.status = 422;
          err1.errorCode = 42205;
          return next(err1);
        }

        // Setting message recipient
        modelInstance.recipient(recipient);

        next();
      });
    } else {
      var err1 = new Error('You should specify recipient_id or dialog_id to post a message');
      err1.status = 422;
      err1.errorCode = 42203;
      return next(err1);
    }
  };

  Message.prototype.markAsDeleted = function(userId, cb) {
    userId = (userId.toString) ?  userId.toString() : userId;

    var modelInstance = this;
    modelInstance.deleted_by = modelInstance.deleted_by || [];
    modelInstance.deleted_by.push(userId);
    console.log(modelInstance.deleted_by);
    modelInstance.save(cb);
  };

  Message.afterCreate = function(next) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    var modelInstance = this;

    if(modelInstance.dialog_id) {
      // Do not need to do something

      modelInstance.users.find({}, function(err, users) {

        if(!users) {
          return next();
        }

          async.eachSeries(users, function(user, cb) {
            if(user.id.toString() != currentUser.id.toString())
              app.io.emitEventForUser(user, 'message:created', modelInstance);
          }, function(err) {
            return next();
          });
      });



    } else if (modelInstance.recipient_id) {

      //searching for private dialogs with this recipient
      findDialogByParticipants(currentUser.id, modelInstance.recipient_id, function(err, dialog) {
        //console.log("dialog search");
        //console.log(dialog);

        if(!dialog) {
          //console.log("dialog not found");
          // Creating dialog
          app.models.dialog.create({
            title: modelInstance.subject || "",
            is_grouped: false,
            is_private: true,
            private_participant_1_id: modelInstance.recipient_id,
            private_participant_2_id: currentUser.id
          }, function(err, dialog) {
            if(err) {
              //console.log(err);
              return next(err);
            }

            if(!dialog) {
              return next(new Error("Dialog not created"));
            }
            //console.log("dialog created");
            //console.log(dialog);

            //setting dialog users
            var recipientUser = null;

            modelInstance.recipient(function(err, recipient) {

              dialog.users.add(currentUser, function(err, ac) {
                dialog.users.add(recipient, noop);
              });


            });

            modelInstance.dialog_id = dialog.id;
            modelInstance.save();

            app.io.emitEventForUser(modelInstance.recipient_id, 'message:created', modelInstance);
            return next();
          });
        } else {

          dialog.deleted_by = null;
          dialog.save();


          console.log("dialog found");
          modelInstance.dialog_id = dialog.id;

          modelInstance.save();



          app.io.emitEventForUser(modelInstance.recipient_id, 'message:created', modelInstance);
          return next();
        }
      });
    }

  };

  Message.beforeUpdate = function(next, modelInstance) {
    modelInstance.updated = (Date.now());
    next();
  };

  Message.disableRemoteMethod('prototype.updateAttributes', true);

  Message.disableRemoteMethod('count', true);
  Message.disableRemoteMethod('upsert', true);
  Message.disableRemoteMethod('update', true);
  Message.disableRemoteMethod('updateOne', true);
  Message.disableRemoteMethod('updateAll', true);
  Message.disableRemoteMethod('exists', true);
  Message.disableRemoteMethod('findOne', true);
  Message.disableRemoteMethod('find', true);
  Message.disableRemoteMethod('deleteById', true);
  Message.disableRemoteMethod('findById', true);

  Message.prototype.setRead = function(cb) {
    this.is_read = true;
    this.save(cb);
  };

  Message.remoteMethod('setRead', {
    isStatic:false,
    description: 'Changes read status of message to \'true\'',
    accepts: [
    ],
    returns: {
      arg: 'message', type: 'message', root: true
    },
    accessType: 'WRITE',
    http: {verb: 'put', path: '/set_read'}
  });
};
