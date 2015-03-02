var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Marker delete tests', function() {

  var markerA = {
    life_time: 300,
    "type": 3,
    text: "new marker for user A ",
    is_up: false,
    is_active: true,
    location: {
      lat: 38.99,
      lng: 27.45
    }
  };

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    userA.id = user.id;
    markerA.text += '' + user.email;
  });

  api.createUser(userB, function(user) {
    userB.id = user.id;
  });

  describe('DELETE /api/markers/{markerA}', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .del('/api/markers/'+markerA.id)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401)
        .end(function (err, res) {
          if (err) return done(err);

          done();
        });
    });
  });

  api.loginAsUser(userA);

  api.createMarker(markerA);

  api.loginAsUser(userB);

  describe('DELETE /api/markers/{markerA}', function () {
    it('should deny removal of marker A for userB ', function (done) {
      request
        .del('/api/markers/'+markerA.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });

  api.loginAsUser(userA);

  describe('DELETE /api/markers/{markerA}', function () {
    it('should allow removal of marker A for userA ', function (done) {
      request
        .del('/api/markers/'+markerA.id)
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
