var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

// -- Add your pre-processing middleware here --
app.use(loopback.context());
app.use(loopback.token());
app.use(function setCurrentUser(req, res, next) {
  console.log('middleware');
  if (!req.accessToken) {
    console.log('access token not found');
    return next();
  }
  app.models.user.findById(req.accessToken.userId, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error('No user with this access token was found.'));
    }

    var loopbackContext = loopback.getCurrentContext();
    if (loopbackContext) {
      console.log('context user set');
      loopbackContext.set('currentUser', user);
    } else {
      console.log('context not found');
    }
    next();
  });
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname);

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};



// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
