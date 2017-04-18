# Hydra-RPC (WIP)
## Requirements
Hydra-RPC requires node >= 7.6 as it uses async/await.
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
const hydra = require('hydra');
const HydraRPC = require('hydra-rpc'); // not published yet
const Promise = require('bluebird');

hydra.use(new HydraRPC());

hydra.init({
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
}).then(() => {
  hydra.methods({
    ping: () => 'pong';
  });
});

setInterval(() => {
  hydra.call('ping')
    .then(result => console.log(result))
    .catch(err => console.log(err));
}, 2000);
```