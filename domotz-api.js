const rq = require('request-promise-native');
const url = require('url');

module.exports = function (RED) {
    function DomotzApi(config) {
        RED.nodes.createNode(this, config);

        let node = this;

        node.api = RED.nodes.getNode(config.api);

        node.on('input', function (msg) {


            if (!node.api || !node.api.key || !node.api.endpoint || !config.endpoint) {
                node.status({fill: "red", shape: "ring", text: "disconnected"});
                return;
            }
            let splitEndpoint = config.endpoint.split(' ');
            let method = splitEndpoint[1];
            let publicApiEndpoint = url.resolve(node.api.endpoint, '/public-api/v1');
            let domotzUrl = publicApiEndpoint +  splitEndpoint[0];

            let options = {
                method: method,
                uri: domotzUrl,
                headers: {
                    'X-API-KEY': node.api.key
                }
            };

            rq(options)
                .then(function (rawResult) {
                    let result = JSON.parse(rawResult);
                    let payload = {
                        payload: result
                    };
                    node.send(payload);
                    node.status({fill: "green", shape: "dot", text: "connected"});
                })
                .catch(function () {
                    node.log("Unable to get " + domotzUrl);
                    node.status({fill: "red", shape: "ring", text: "disconnected"});
                });
        });

        if (!node.api || !node.api.key || !node.api.endpoint) {
            node.status({fill: "red", shape: "ring", text: "disconnected"});
        } else {
            node.log("Domotz API base endpoint is " + node.api.endpoint);
            node.log("Domotz Chosen Endpoint is " + config.endpoint);

            let options = {
                uri: url.resolve(node.api.endpoint, 'public-api/v1/user'),
                headers: {
                    'X-API-KEY': node.api.key
                }
            };
            rq(options)
                .then(function (user) {
                    let userObj = JSON.parse(user);
                    node.log("Domotz User id: " + userObj.id + " name: " + userObj.name);
                    node.status({fill: "green", shape: "dot", text: "connected"});
                })
                .catch(function () {
                    node.log("Unable to authenticate");
                    node.status({fill: "red", shape: "ring", text: "disconnected"});
                });
        }
    }

    RED.nodes.registerType("domotz-api", DomotzApi);
};