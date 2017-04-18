const Promise = require('bluebird');
const HydraPlugin = require('hydra/plugin');
const R = require('ramda');
const uuid = require('uuid/v1');
const didyoumean = require('didyoumean');

const rpcKey = 'hydra:service:rpc:hash';

class HydraRPC extends HydraPlugin {
	constructor() {
		super('hydra-rpc');
	}

	setHydra(hydra) {
		super.setHydra(hydra);

		let initialized = false;
		const initRPC = () => {
			if (!hydra.isService){
				hydra.registerService();
			}
			if (!initialized){
				initialized = true;
				const sub = hydra.redisdb.duplicate();
				sub.on('message', async (channel, message) => {
					const {id, methodName, args} = JSON.parse(message);
					const handler = R.propOr(R.always(null), methodName, hydra._rpcHandlers);
					const data = await handler.apply(handler, args);
					hydra.redisdb.publish(id, JSON.stringify({data}));
				});
				sub.subscribe(`hydra-rpc:${hydra.getInstanceID()}`);
			}
		}

		hydra.methods = obj => R.toPairs(obj).forEach(([methodName, fn]) => addMethod(methodName, fn));

		const addMethod = (methodName, fn) => {
			hydra.redisdb.hset(rpcKey, methodName, hydra.serviceName);
			hydra._rpcHandlers = hydra._rpcHandlers || {};
			hydra._rpcHandlers[methodName] = fn;
			initRPC();
		};

		const rand = (min, max) => Math.floor(Math.random() * (max - min)) + min

		hydra.call = async (methodName, ...args) => {
			const id = uuid();
			const serviceName = await hydra.redisdb.hgetAsync(rpcKey, methodName);
			const instanceIds = R.map(R.prop('instanceID'), await hydra.getServicePresence(serviceName));
			if (!serviceName || instanceIds.length == 0){
				const allMethods = R.keys(await hydra.redisdb.hgetallAsync(rpcKey));
				const closest = didyoumean(methodName, allMethods);
				const suggest = closest ? `Did you mean "${closest}"?` : '';
				throw new Error(`No Service registered for "${methodName}" method. ${suggest}`);
			}
			const publish = (instance) => hydra.redisdb.publishAsync(`hydra-rpc:${instance}`, JSON.stringify({id, methodName, args}));
			const result = new Promise((resolve, reject) => {
				const sub = hydra.redisdb.duplicate();
				sub.on('subscribe', async () => {
					let count = 0, tries = 0;
					while (count == 0 && tries < 20){
						count = await publish(instanceIds[rand(0, instanceIds.length)]);
						tries++;
					}
					if (count == 0){
						reject(new Error('No available endpoints'));
					}
				});
				sub.on('message', (channel, message) => {
					resolve(JSON.parse(message).data);
					sub.unsubscribe();
					sub.quit();
				});
				sub.subscribe(id);
			});
			return result;
		};
	}

	onServiceReady() {
		Promise.promisifyAll(this.hydra.redisdb);
		console.log(`[HydraRPC plugin] hydra service running on ${this.hydra.config.servicePort}`);
	}
}
module.exports = HydraRPC;