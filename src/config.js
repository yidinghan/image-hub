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
        description: [
          '# base64 image convert',
          'base64 图片转换',
          'http://base64image.org/',
        ].join('\n'),
      },
      tags: [],
      // host: 'localhost:3000',
      // schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
    exposeRoute: true,
  },
};
