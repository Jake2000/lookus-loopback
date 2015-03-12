var loopback = require('loopback');
var app = require('./../../server/server');
var noop = function() {};

module.exports = function(FriendsContainerUser) {

  FriendsContainerUser.afterSave = function (next) {
    var modelInstance = this;

    app.models.friendsContainer.findById(modelInstance.friendsContainer_id ,function(err, friendsContainer) {
      app.models.user.findById(friendsContainer.user_id, function(err,user) {
        user.friends_count++;
        user.save(function(err, user) {
          return;
        })
      });
    });
    next();
  };

  FriendsContainerUser.beforeDestroy = function(next, modelInstance) {
    app.models.friendsContainer.findById(modelInstance.friendsContainer_id ,function(err, friendsContainer) {
      app.models.user.findById(friendsContainer.user_id, function(err,user) {
        user.friends_count--;
        if(user.friends_count<0){
          user.friends_count = 0;
        }
        user.save(function(err, user) {
          return;
        })
      });
    });
    next();
  }
};
