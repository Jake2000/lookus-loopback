var chai = require('chai');
chai.should();
var request = require('supertest');
var async = require('async');
var api = require('../helpers/api.js');
request = request('http://localhost:3301');

describe('Users search tests', function() {

  var userA = api.generateRandomUser();
  var userB = api.generateRandomUser();
  var userC = api.generateRandomUser();
  var userD = api.generateRandomUser();

  userA.first_name = 'John';
  userA.last_name = 'Pemberton';

  userB.first_name = 'Maria';
  userB.last_name = 'De Lesseps';

  userC.first_name = 'Brown';
  userC.last_name = 'John';

  userD.first_name = 'Maria';
  userD.last_name = 'Reynolds';


  api.createUser(userA, function(user){
    userA = user;
  });

  api.createUser(userB, function(user){
    userB = user;
  });

  api.createUser(userC, function(user){
    userC = user;
  });

  api.createUser(userD, function(user){
    userD = user;
  });

  api.loginAsNormalUser();

  describe('GET /api/users?query=John', function () {
    it('should search user by firstname or lastname', function (done) {
      request
        .get('/api/users?query=John')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.contain.an.item.with.property('id', userA.id);
          res.body.should.contain.an.item.with.property('id', userC.id);
          done();
        });
    });
  });

  describe('GET /api/users?limit=2&offset=2', function () {
    it('should limit the users to 2 and have offset 2', function (done) {
      request
        .get('/api/users?limit=2&offset=2')
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.be.instanceOf(Array);
          res.body.should.have.length(2);
          done();
        });
    });
  });

});
