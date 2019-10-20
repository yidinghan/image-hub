const sharpApis = require('./controller/sharp');

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
module.exports = async (fastify) => {
  // @ts-ignore
  fastify.route(sharpApis.root);
};
