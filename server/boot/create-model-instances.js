var debug = require('debug')('boot:create-model-instances');

module.exports = function(app) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;


  User.create([
    {username: 'user', email: 'user1@infloop.ru', password: '123456789'},
    {username: 'admin', email: 'admin1@infloop.ru', password: '123456789'}
  ], function(err, users) {
    if (err) return debug('%j', err);


    Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) return debug(err);
      debug(role);

      // Make 'admin' an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[1].id
      }, function(err, principal) {
        if (err) return debug(err);
        debug(principal);
      });
    });
  });
};
