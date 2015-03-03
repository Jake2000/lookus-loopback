var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var _ = require('lodash');

var app = module.exports = loopback();
var cors = require('cors');

// File upload
var ds = loopback.createDataSource({
  connector: require('loopback-component-storage'),
  provider: 'filesystem',
  root: path.join(__dirname, '../client/uploads')
});

//var StorageService = require('loopback-component-storage').StorageService;
//var uploadHandler = new StorageService({provider: 'filesystem', root: '/tmp/storage'});

var container = ds.createModel('container');
app.model(container, { public:false });
//ds.connector.StorageService


// Enable CORS
app.use(cors());
app.options('*', cors());

// -- Add your pre-processing middleware here --
app.use(loopback.context());
app.use(loopback.token());
app.use(function setCurrentUser(req, res, next) {
  //console.log('Trying to retrieve accessToken');
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

// Passport configurators..
var loopbackPassport = require('./passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);
app.passportConfigurator = passportConfigurator;


// Build the providers/passport config
var os = require("os");
var hostname = os.hostname();
var config = {};
try {
  if (hostname == 'Inflcomp'){
    config = require('./providers-test.json');
  } else {
    config = require('./providers.json');
  }
} catch (err) {
  console.error('Please configure your passport strategy in `providers.json`.');
  console.error('Create `providers.json` file in server/boot directory and replace the clientID/clientSecret values with your own.');
  console.trace(err);
  process.exit(1); // fatal
}

// Setup the view engine (jade)
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname);


// Start passportConfigurator
passportConfigurator.init(true);
passportConfigurator.setupModels({
  userModel: app.models.user,
  userIdentityModel: app.models.userIdentity,
  userCredentialModel: app.models.userCredential
});
for (var s in config) {
  var c = config[s];
  c.session = c.session !== false;
  passportConfigurator.configureProvider(s, c);
}



app.get('/', function (req, res, next){
  res.render('pages/login', {
    user: req.user,
    url: req.url
  });
});

app.get('/local', function (req, res, next){
  res.render('pages/local', {
    user: req.user,
    url: req.url
  });
});

app.get('/map', function (req, res, next){
  res.render('pages/map', {
    user: req.user,
    url: req.url
  });
});

app.get('/welcome', function (req, res, next){
  res.render('pages/welcome', {
    user: req.user,
    url: req.url
  });
});

app.get('/ws', function (req, res, next){
  res.render('pages/ws', {
    user: req.user,
    url: req.url
  });
});

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

app.io = {};

var socketsByToken = {};
var socketsByUser = {};

var emitEventForUser = function(user, eventName, eventArgs) {
  var userId = user;

  if(user === '*') {
    app.io.emit(eventName, eventArgs);
    return;
  }

  if(user instanceof app.models.user) {
    userId = user.id.toString()
  }

  if(socketsByUser[userId]) {
    var socket = socketsByUser[userId];
    socket.emit(eventName, eventArgs);
  }

};


// start the server if `$ node server.js`
if (require.main === module) {
  app.start();

  //starting io.js
  var ioapp = require('express')();
  ioapp.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    return next();
  });
  var server = require('http').Server(ioapp);
  app.io = require('socket.io')(server);
  server.listen(3302);

  app.io.emitEventForUser = emitEventForUser;

  app.io.on('connection', function(socket){
    socket.auth = false;
    console.log('a user connected');
    app.io.emit('log', { code: 200, type: 'user:connected', socket_id: socket.id});

    // Msg echo
    socket.on('msg', function(msg){
      console.log('msg: ' + msg.text);
      msg.text = "server." + msg.text;
      app.io.emit('msg', msg);
      app.io.emit('log', { code: 200, type: 'msg:incoming', socket_id: socket.id});
    });

    // Disconnect
    socket.on('disconnect', function(){
      console.log('user disconnected');
      app.io.emit('log', { code: 200, type: 'user:disconnected', socket_id: socket.id});
    });

    // Auth
    socket.on('auth', function(auth){
      console.log('io:auth: ' + auth.token);
      if(auth.token && _.isString(auth.token)) {

        app.models.AccessToken.findById(auth.token, function(err, token) {

          if(token) {
            socket.auth = true;
            socketsByToken[token.id.toString()] = socket;
            socketsByUser[token.userId] = socket;
            socket.emit('auth', { code: 200 });
          } else {
            socket.emit('auth', { code: 404, error: 'Token not found'});
          }
        });
      }
    });

    // Status
    socket.on('status', function(){
      console.log('io: status');
      app.io.emit('status', {auth: socket.auth, code: 200});
    });

  });

}





