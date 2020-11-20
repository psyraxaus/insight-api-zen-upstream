'use strict';
var StatusController = require('../lib/status');
var should = require('should');
var sinon = require('sinon');

describe('Status supply', function() {
  it('check supply at height', function() {

    var node = {
      log: {}
    };
    var status = new StatusController(node);


    status.calculateTotalSupply(0).should.eql(0);
    status.calculateTotalSupply(1).should.eql(12.5);
    status.calculateTotalSupply(2).should.eql(25);
    status.calculateTotalSupply(3).should.eql(37.5);
    status.calculateTotalSupply(100).should.eql(1250);
    status.calculateTotalSupply(747293).should.eql(9341162.5);
    status.calculateTotalSupply(840000).should.eql(10500000);
    status.calculateTotalSupply(840001).should.eql(10500006.25);
    status.calculateTotalSupply(840002).should.eql(10500012.5);
    status.calculateTotalSupply(1680000).should.eql(15750000);
    status.calculateTotalSupply(1680001).should.eql(15750003.125);
    status.calculateTotalSupply(53760000).should.eql(20999999.9076);
    status.calculateTotalSupply(53760001).should.eql(21000000);   

  });

  it('check getTotalSupply response', function(done) {

    var res = function(err, data) {
        data.supply.should.equal(1250);
        done();
    }
    var node = {
      log: {},
      services: {
        bitcoind: {
          getInfo: sinon.stub().callsArgWith(0, null, {blocks: 100}),
        }
      }
    };

    var status = new StatusController(node);
    status.getTotalSupply(res);

  });


  it('check getCurretSupply response', function(done) {
    var req = {
      query: {
        format: 'object'
      }
    };
    var res = {
      jsonp: function(data) {
        data.supply.should.equal(1250);
        done();
      }
    }
    var node = {
      log: {},
      services: {
        bitcoind: {
          getInfo: sinon.stub().callsArgWith(0, null, {blocks: 100}),
        }
      }
    };
    var status = new StatusController(node);
    status.getCurrentSupply(req, res);
  });



});