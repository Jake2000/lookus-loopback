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

  userA.first_name = 'Violet';
  userA.last_name = 'Pemberton';

  userB.first_name = 'Poker';
  userB.last_name = 'De Lesseps';

  userC.first_name = 'Column';
  userC.last_name = 'Mike';

  api.createUser(userA, function(user){
    userA = user;
  });

  api.createUser(userB, function(user){
    userB = user;
  });

  api.createUser(userC, function(user){
    userC = user;
  });

  api.loginAsUser(userC);
  api.loginAsUser(userA);

  describe('GET /api/users/userB', function () {
    it('should get offline userB', function (done) {
      request
        .get('/api/users/'+userB.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('is_online').and.equal(false);
          done();
        });
    });
  });

  describe('GET /api/users/userC', function () {
    it('should get online userC', function (done) {
      request
        .get('/api/users/'+userC.id)
        .set('Authorization', api.session.authToken)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          res.body.should.have.property('is_online').and.equal(true);
          done();
        });
    });
  });

});
