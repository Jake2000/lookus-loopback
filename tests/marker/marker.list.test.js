var chai = require('chai');
chai.should();
chai.use(require('chai-things'));

var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');

request = request('http://localhost:3301');

describe('Marker resource tests', function() {

  var marker = {
    life_time: 300,
    "type": 3,
    text: "new marker for user ",
    is_up: false,
    is_active: true,
    location: {
      lat: 38.99,
      lng: 27.45
    }
  };

  var userA = api.generateRandomUser();

  api.createUser(userA.email, function(user) {
    marker.text += '' + user.email;
  });

  describe('GET /api/users/{unauthorized}/markers', function () {
    it('should throw access exception for unauthorized user', function (done) {
      request
        .get('/api/users/'+userA.id+'/markers')
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

  describe('GET /api/users/{userA}/markers', function () {
    it('should list empty array (for userA)', function (done) {
      request
        .get('/api/users/'+userA.id+'/markers')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(0);
          done();
        });
    });
  });

  api.createMarker(marker);

  describe('GET /api/users/{userA}/markers', function () {
    it('should list array with one marker (for userA)', function (done) {
      request
        .get('/api/users/'+userA.id+'/markers')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(1);
          res.body.should.contain.an.item.with.property('id', marker.id);
          done();
        });
    });
  });



});
