const pino = require('pino');

module.exports = {
  fastify: {
    logger: {
      level: 'info',
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    },
  },
  fastifySwagger: {
    routePrefix: '/swagger',
    swagger: {
      info: {
        title: 'API',
        version: '1.0.0',
        description: [].join(''),
      },
      tags: [],
      // host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
    exposeRoute: true,
  },
};
