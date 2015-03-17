var crypto  = require('crypto'),
    _       = require('underscore'),
    request = require('request');

var enormousURL                = 'https://enormous.io',
    enormousRealtimeMessageURL = enormousURL + '/apps/emit/';

//Flatten an object or array into a string consisting of keys and values
var stringifyParams = function (params) {
    if (!_.isObject(params))
        return params;

    var returnStr,
        paramArr = [];

    _.each(params, function (val, key) {
        if (_.isObject(val))
            return paramArr.push(key, stringifyParams(val));

        paramArr.push(key, val);
    });

    returnStr = paramArr.join(' ');

    return returnStr;
};

var e = function (options) {
    options = options || {};

    var self = this;

    self.appKey = options.appKey;
    self.appSecret = options.appSecret;

    self.emitToChannel = function (options, next) {
        var requestConfig = self.getEmitRequestConfig(options);

        request(requestConfig, next);

        return self;
    };

    self.getEmitRequestConfig = function(options){
        options = options || {};

        var requestURL = enormousRealtimeMessageURL + self.appKey,
            emitData = {
                channel: options.channel,
                actionName: options.actionName,
                data: options.data || null
            },
            requestConfig = {
                url: requestURL,
                json: true,
                method: 'post'
            };

        if (options.privateKeyAuth) {
            emitData.auth = self.generatePrivateKeyParams(emitData.data).auth;
        }else if (options.basicUsername){
            requestConfig.auth = {
                username: options.basicUsername,
                password: options.basicPassword,
                sendImmediately: true
            }
        } else {
            emitData.appSecret = self.appSecret;
        }

        requestConfig.qs = emitData;

        return requestConfig;
    };

    self.generatePrivateKeyParams = function (params) {
        params = params || {};

        var secureParams = {
            auth: {
                timestamp: null,
                timestampHash: null
            },
            params: params
        };

        var timestamp = Math.round(Date.now() / 1000).toString();

        secureParams.auth.timestamp = timestamp;
        secureParams.auth.timestampHash = crypto.createHmac('SHA256', self.appSecret).update(timestamp).digest('hex');

        if (_.size(params) && _.isObject(params)) {
            secureParams.auth.paramsHash = crypto.createHmac('SHA256', self.appSecret).update(stringifyParams(params)).digest('hex');
        }

        return secureParams;
    };

    return self;
};

module.exports = e;