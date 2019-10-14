const fastifySwagger = require('fastify-swagger');

const routes = require('./src/routes');

const config = require('./src/config');

// eslint-disable-next-line import/order
const fastify = require('fastify')(config.fastify);

// for health check
fastify.register((app, opts, next) => {
  app.get('/', async () => ({ success: true }));
  return next();
});

fastify.register(fastifySwagger, config.fastifySwagger);
fastify.register(routes);

if (!module.parent) {
  fastify.listen(3000, '0.0.0.0', (err) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  });
}

exports.fastify = fastify;
