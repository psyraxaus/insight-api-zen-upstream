var Common = require('./common');
var LRU = require('lru-cache');

function SidechainController(node, options) {
    var self = this;
    this.node = node;
    this.sidechainCache = LRU(options.sidechaintCacheSize || SidechainController.DEFAULT_SIDECHAIN_CACHE_SIZE);

    this.common = new Common({log: this.node.log});
}

SidechainController.MAXIMUM_SIDECHAIN_SIZE = 10;
SidechainController.DEFAULT_SIDECHAIN_CACHE_SIZE = 50;

SidechainController.prototype.list = function(req, res) {
    var self = this;

    var onlyAlive = req.query.onlyAlive ? req.query.onlyAlive : 0;
    var from = req.query.from ? req.query.from : 0;
    var to = req.query.to ? req.query.to : SidechainController.MAXIMUM_SIDECHAIN_SIZE;
    if (to-from > SidechainController.MAXIMUM_SIDECHAIN_SIZE) {
        to = from + SidechainController.MAXIMUM_SIDECHAIN_SIZE;
    }

    this.getScInfo("*", {onlyAlive: onlyAlive, from: from, to: to}, function(err, data) {
        if(err) {
            return self.common.handleErrors(err, res);
        }
        var result = {
            totalItems: data.length,
            from: from,
            to: to,
            items: data.map(sc => self.transformSidechain(sc))
        }
        res.jsonp(result);
    });
};

SidechainController.prototype.sidechain = function(req, res) {
    var self = this;

    var sidechainCache = self.sidechainCache.get(req.params.scid);
    if (sidechainCache) {
        res.jsonp(sidechainCache);
    } else {
        this.getScInfo(req.params.scid, {}, function(err, data) {
            if(err) {
                return self.common.handleErrors(err, res);
            }
            var transformedSidechain = self.transformSidechain(data[0]);
            self.sidechainCache.set(req.params.scid, transformedSidechain)
            res.jsonp(transformedSidechain);
        });
    }
};

SidechainController.prototype.getScInfo = function(scid, options, callback) {
    this.node.getScInfo(scid, options,function(err, scinfos) {
        if(err) {
            return callback(err);
        }
        callback(null, scinfos);
    });
}


SidechainController.prototype.transformSidechain = function (sc) {
    return {
        scid: sc.scid,
        balance: sc.balance,
        withdrawalEpochLength: sc.withdrawalEpochLength,
        state: sc.state,
        'creating tx hash': sc['creating tx hash'],
        'created at block height': sc['created at block height'],
        'last certificate epoch':  sc['last certificate epoch'],
        'last certificate hash': sc['last certificate hash'],
        'last certificate quality': sc['last certificate quality'],
        'immature amounts': sc['immature amounts'],
        'ceasing height': sc['ceasing height'],
        'end epoch height': sc['end epoch height']
    }
}

module.exports = SidechainController;
