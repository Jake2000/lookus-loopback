module.exports = function mountLoopBackExplorer(server) {
  var explorer;
  try {
    explorer = require('loopback-explorer');
  } catch(err) {
    // Print the message only when the app was started via `server.listen()`.
    // Do not print any message when the project is used as a component.
    server.once('started', function(baseUrl) {
      console.log(
        'Run `npm install loopback-explorer` to enable the LoopBack explorer'
      );
    });
    return;
  }

  var restApiRoot = server.get('restApiRoot');

  // Overriding remotes for swagger UI
  // !The crunch!
  var remotes = server.remotes;
  server.remotes = function() {
    var remotesObj = remotes.apply(server, arguments);

    var handler = remotesObj.handler('rest');


    return remotesObj;
  };

  var adapter = server.remotes().handler('rest').adapter;
  var routes = adapter.allRoutes();
  adapter.allRoutes = function() {
    var arr = routes.apply(adapter, arguments);

    arr.push({
      accepts: [],
      description: 'Login as VK user',
      documented: true,
      errors: undefined,
      method: 'users.loginVK',
      notes: '',
      path: '/users/login/vk',
      verb: 'get',
      returns: []
    });
    return arr;
  };


  var explorerApp = explorer(server, { basePath: restApiRoot });
  server.use('/explorer', explorerApp);
  server.once('started', function() {
    var baseUrl = server.get('url').replace(/\/$/, '');
    // express 4.x (loopback 2.x) uses `mountpath`
    // express 3.x (loopback 1.x) uses `route`
    var explorerPath = explorerApp.mountpath || explorerApp.route;
    console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
  });
};
