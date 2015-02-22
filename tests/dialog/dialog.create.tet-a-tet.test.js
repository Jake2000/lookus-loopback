var chai = require('chai');
chai.should();
chai.use(require('chai-things'));
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Dialog resource tests', function() {

  var dialog = {
    title: ''
  };

  var msgAB = {
    body: 'test message AB',
    subject: 'hello',
    recipient_id: 'objectid'
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user){
    userA = user;
  });

  api.createUser(userB.email, function(user){
    userB = user;
    msgAB.recipient_id = userB.id;
  });

  api.loginAsUser(userA);

  api.sendMessage(msgAB, function(message) {
    msgAB.id = message.id;
    msgAB.dialog_id = message.dialog_id;
    dialog.id = message.dialog_id;
  });

  describe('GET /api/users/{userA}/dialogs/', function () {
    it('should include new private tet-a-tet dialog for userA', function (done) {
      request
        .get('/api/users/'+userA.id+'/dialogs')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(1);
          res.body.should.contain.an.item.with.property('id', dialog.id);
          done();
        });
    });
  });
});
