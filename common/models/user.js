module.exports = function(User) {

  User.login.shared = false;
  User.resetPassword.shared = false;

  //User.disableRemoteMethod('login', false);
  User.disableRemoteMethod('upsert', true);
  User.disableRemoteMethod('updateAll', true);
  User.disableRemoteMethod('exists', true);
  User.disableRemoteMethod('findOne', true);
  User.disableRemoteMethod('count', true);
  User.disableRemoteMethod('find', true);

  User.remoteMethod(
    'login',
    {
      description: 'Login a user with username/email and password',
      accepts: [
        {arg: 'credentials', type: 'credentials', required: true, http: {source: 'body'}}
      ],
      returns: {
        arg: 'accessToken', type: 'AccessToken', root: true,
        description:
        'The response body contains properties of the AccessToken created on login.\n'
      },
      http: {verb: 'post'}
    }
  );



  User.remoteMethod(
    'resetPassword',
    {
      description: 'Reset password for a user with email',
      accepts: [
        {arg: 'options', type: "email", required: true, http: {source: 'body'}}
      ],
      http: {verb: 'post', path: '/reset'}
    }
  );
};
