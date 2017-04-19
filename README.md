# Hydra-RPC (WIP)
Create and consume [remote procedure calls](https://en.wikipedia.org/wiki/Remote_procedure_call) in hydra with ease.

## Install
Not published on npm yet, for now you'll need to clone the repo.
```shell
$ git clone https://github.com/ecwyne/hydra-rpc
```
## Use
Two methods are added to the hydra instance to add or consume methods
```javascript
// hydra.methods(obj: Object);
// Object has keys of method names and values of functions.
hydra.methods({
    methodName: (arg1, arg2, arg3) => arg1 + arg2; // return value or Promise
});
```

```javascript
// hydra.call(methodName: String, ...arguments) => Promise
// First argument is method name.
// Remaining arguments are sent to method (must be serializable).
// Returns a promise with the result.
hydra.call('methodName', arg1, arg2, arg3).then(...);
```

## Example
```javascript
// Service1.js
const hydra = require('hydra');
const HydraRPC = require('hydra-rpc'); // not published yet
const Promise = require('bluebird');

hydra.use(new HydraRPC());

hydra.init({...}).then(() => {
  hydra.methods({
    ping: () => 'pong',
    sleepPing: delay => Promise.resolve('pong').delay(delay) // optionally return promises
  });
});
```

```javascript
// Service2.js (even works on separate machines!)
const hydra = require('hydra');
const HydraRPC = require('hydra-rpc'); // not published yet

hydra.use(new HydraRPC());

hydra.init({...}).then(() => {
  hydra.call('ping').then(result => console.log(result)); // Logs "pong"!
  hydra.call('sleepPing', 1000).then(result => console.log(result)); // Result comes back after 1000 ms!
});
```

Config object must have hydra.plugins.hydra-rpc [for now](https://github.com/flywheelsports/hydra/pull/85)
```javascript
// config.js
module.exports = {
  hydra: {
    serviceName: 'hydra-rpc-example',
    serviceIP: '',
    servicePort: 0,
    serviceType: 'router',
    serviceDescription: 'example for hydra-rpc plulgin',
    redis: {
      host: 'localhost',
      db: 15
    },
      plugins: {
        'hydra-rpc': {} // required for now (see https://github.com/flywheelsports/hydra/pull/85)
      }
  }
}
```