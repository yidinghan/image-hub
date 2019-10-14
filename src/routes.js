const sharpApis = require('./controller/sharp')

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
module.exports = async (fastify) => {
  fastify.post('/sharp', sharpApis.root)
};