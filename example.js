const hydra = require('hydra');
const HydraRPC = require('./index.js');
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
			'hydra-rpc': {}
		}
	}
}).then(() => {
	hydra.methods({
		ping: (...args) => Promise.resolve('pong ' + hydra.getInstanceID()).delay(200)
	});
});

setInterval(() => {
	const start = Date.now();
	hydra.call('ping')
		.then(result => console.log({result, time: Date.now() - start}))
		.catch(err => console.log(err));

}, 2000);