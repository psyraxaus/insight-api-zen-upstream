'use strict';

var Common = require('./common');

function StatusController(node) {
  this.node = node;
  this.common = new Common({log: this.node.log});
}

StatusController.prototype.show = function(req, res) {
  var self = this;
  var option = req.query.q;

  switch(option) {
  case 'getDifficulty':
    this.getDifficulty(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getTotalSupply':
    this.getTotalSupply(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getLastBlockHash':
    res.jsonp(this.getLastBlockHash());
    break;
  case 'getBestBlockHash':
    this.getBestBlockHash(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getNetHash':
    this.getMiningInfo(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        nethashps: result
      });
    });
    break;
  case 'getInfo':
  default:
    this.getInfo(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        info: result
      });
    });
  }
};

StatusController.prototype.getMiningInfo = function(callback) {
  this.node.services.bitcoind.getMiningInfo(function(err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result.networkhashps);
  });
};

StatusController.prototype.getInfo = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, result) {
    if (err) {
      return callback(err);
    }
    var info = {
      version: result.version,
      protocolversion: result.protocolVersion,
      blocks: result.blocks,
      timeoffset: result.timeOffset,
      connections: result.connections,
      proxy: result.proxy,
      difficulty: result.difficulty,
      testnet: result.testnet,
      relayfee: result.relayFee,
      errors: result.errors,
      network: result.network
    };
    callback(null, info);
  });
};

StatusController.prototype.getLastBlockHash = function() {
  var hash = this.node.services.bitcoind.tiphash;
  return {
    syncTipHash: hash,
    lastblockhash: hash
  };
};

StatusController.prototype.getBestBlockHash = function(callback) {
  this.node.services.bitcoind.getBestBlockHash(function(err, hash) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      bestblockhash: hash
    });
  });
};

StatusController.prototype.getDifficulty = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      difficulty: info.difficulty
    });
  });
};

StatusController.prototype.getTotalSupply = function(callback) {
  var self = this;
  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      supply: self.calculateTotalSupply(info.blocks)
    });
  });
};

StatusController.prototype.getCurrentSupply = function(req, res) {
  var self = this;
  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    if (req.query.format === 'object') {
      return res.jsonp({
        supply: self.calculateTotalSupply(info.blocks)
      });
    }

    var supply = self.calculateTotalSupply(info.blocks);
    return res.status(200).send(supply.toString());
  });
};

StatusController.prototype.sync = function(req, res) {
  var self = this;
  var status = 'syncing';

  this.node.services.bitcoind.isSynced(function(err, synced) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    if (synced) {
      status = 'finished';
    }

    self.node.services.bitcoind.syncPercentage(function(err, percentage) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      var info = {
        status: status,
        blockChainHeight: self.node.services.bitcoind.height,
        syncPercentage: Math.round(percentage),
        height: self.node.services.bitcoind.height,
        error: null,
        type: 'bitcore node'
      };

      res.jsonp(info);

    });

  });

};

// Hard coded to make insight ui happy, but not applicable
StatusController.prototype.peer = function(req, res) {
  res.jsonp({
    connected: true,
    host: '127.0.0.1',
    port: null
  });
};

StatusController.prototype.version = function(req, res) {
  var pjson = require('../package.json');
  res.jsonp({
    version: pjson.version
  });
};

StatusController.prototype.calculateTotalSupply = function(height) {
    const HALVING_INTERVAL = 840000;
    if (height == 0)
        return 0;
  
    var totHalvings= Math.floor((height - 1) / HALVING_INTERVAL);
    //Force block reward to zero when right shift is undefined
    if (totHalvings >= 64) {
        return 21000000;  //max supply reached 
    }

    var supply = 0;
    var reward = 1250000000;  //block reward in satoshi
    while (height > (HALVING_INTERVAL -1)) {
      supply = supply + (HALVING_INTERVAL* reward)
      //Reward is cut in half every 840,000 blocks which will occur approximately every 4 years.
      reward = (reward >> 1);
      height = height - HALVING_INTERVAL;
    }
    return (supply + (height* reward)) / 100000000;
};

module.exports = StatusController;

