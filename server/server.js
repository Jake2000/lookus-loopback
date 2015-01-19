var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

// Passport configurators..
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

// Build the providers/passport config
var config = {};
try {
  config = require('./providers.json');
} catch (err) {
  console.error('Please configure your passport strategy in `providers.json`.');
  console.error('Create `providers.json` file in server/boot directory and replace the clientID/clientSecret values with your own.');
  console.trace(err);
  process.exit(1); // fatal
}

// -- Add your pre-processing middleware here --
app.use(loopback.context());
app.use(loopback.token());
app.use(function setCurrentUser(req, res, next) {
  if (!req.accessToken) {
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
      loopbackContext.set('currentUser', user);
    } else {
      console.log('loopback context not found');
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
