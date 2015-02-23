var chai = require('chai');
chai.should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Message set_read scenario', function() {

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
  });

  api.loginAsUser(userB);

  describe('PUT /api/messages/{id}/set_read', function () {
    it('should set message read by userB', function (done) {
      request
        .put('/api/messages/'+msgAB.id+'/set_read')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(204)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });


});
