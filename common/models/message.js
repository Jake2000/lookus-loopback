var loopback = require('loopback');
var app = require('./../../server/server');
var _ = require('lodash');
var noop = function() {};

module.exports = function(Message) {

  Message.beforeCreate = function(next, modelInstance) {

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
        if(!dialog) {
          var err1 = new Error('Dialog with id \''+modelInstance.dialog_id+'\' not found');
          err1.status = 422;
          err1.errorCode = 42204;
          return next(err1);
        }

        next();
      });
    } else if (modelInstance.recipient_id) {
      //fetching recipient
      app.models.user.findById(modelInstance.recipient_id, function(err, recipient) {
        if(!recipient) {
          var err1 = new Error('Recipient with id \''+modelInstance.recipient_id+'\' not found');
          err1.status = 422;
          err1.errorCode = 42205;
          return next(err1);
        }

        next();
      });
    } else {
      var err1 = new Error('You should specify recipient_id or dialog_id to post a message');
      err1.status = 422;
      err1.errorCode = 42203;
      return next(err1);
    }
  };

  Message.afterCreate = function(next) {
    var ctx = loopback.getCurrentContext();
    var currentUser = ctx && ctx.get('currentUser');
    var modelInstance = this;



    if(modelInstance.dialog_id) {

    } else if (modelInstance.recipient_id) {
      //searching for private dialogs with this recipient
      app.models.dialog.findOne({
        where: { is_private: true, users_count:2 },
        include: {
          relation: 'users', // include the owner object
          scope: { // further filter the owner object
            where: {id: modelInstance.recipient_id} // only select order with id 5
          }
        }
      }, function(err, dialog) {
        console.log("dialog search");
        console.log(dialog);

        if(!dialog) {
          console.log("dialog not found");
          //creating dialog
          app.models.dialog.create({
            title: modelInstance.subject || "",
            is_private: true,
            users_count: 0
          }, function(err, dialog) {
            if(err) {
              console.log(err);
              return next(err);
            }

            if(!dialog) {
              return next(new Error("Dialog not created"));
            }
            console.log("dialog created");
            console.log(dialog);

            //setting dialog users
            dialog.users.add(currentUser, noop);

            app.models.user.findById(modelInstance.recipient_id, function(err, recipient) {
              if (recipient) {
                dialog.users.add(recipient, noop);
                dialog.save(noop);
              }
            });


            modelInstance.dialog_id = dialog.id;
            modelInstance.save();
            return next();
          });
        } else {

          console.log("dialog found");
          modelInstance.dialog_id = dialog.id;
          modelInstance.save();
          return next();
        }
      });
    }

  };


  Message.disableRemoteMethod('upsert', true);
  Message.disableRemoteMethod('update', true);
  Message.disableRemoteMethod('updateAll', true);
  Message.disableRemoteMethod('exists', true);
  Message.disableRemoteMethod('findOne', true);
  Message.disableRemoteMethod('find', true);
};
