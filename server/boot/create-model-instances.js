var debug = require('debug')('boot:create-model-instances');

module.exports = function(app) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  User.create([
    { username: 'user',
      email: 'user1@infloop.ru',
      password: '123456789',
      first_name: "John",
      last_name: "Welsh",
      birthday: "1987-01-01",
      image_url: "/images/avatar.png",
      country: "russia",
      city: "saint-petersburg",
      sex: 1
      },
    { username: 'admin',
      email: 'admin1@infloop.ru',
      password: '123456789',
      first_name: "Mark",
      last_name: "Scheinder",
      birthday: "1987-01-01",
      image_url: "/images/avatar.png",
      country: "russia",
      city: "saint-petersburg",
      sex: 1
    }
  ], function(err, users) {
    if (err) {
      debug('%j', err);
      throw err;
    }



    Role.create({
      name: 'admin'
    }, function(err, role) {
      if (err) {
        debug('%j', err);
        throw err;
      }

      debug(role);

      // Make 'admin' an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[1].id
      }, function(err, principal) {
        if (err)  {
          debug(err);
          throw err;
        }
        debug(principal);
      });
    });
  });
};
