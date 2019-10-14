const sharp = require('sharp');

const taskKindFns = {
  /**
   * @param {import('sharp').Sharp} pipeline
   */
  metadata: (pipeline) => {
    return pipeline.metadata();
  },
};

const root = async (request, reply) => {
  const { image: imageBase64, tasks } = request.body;

  let pipeline = sharp(Buffer.from(imageBase64, 'base64'));
  tasks.forEach(({ kind, args }) => {
    pipeline = taskKindFns[kind](pipeline, args);
  });

  if ('then' in pipeline) {
    // @ts-ignore
    reply.send(await pipeline.then());
  }
  reply.send(pipeline);
};

const apis = {
  root: {
    url: '/sharp',
    method: 'POST',
    handler: root,
    schema: {
      summary: '图片处理API',
      body: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            desciption: 'base64 encode image',
          },
          tasks: {
            desciption: '任务队列',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kind: {
                  type: 'string',
                  desciption: '任务类型',
                  enum: ['metadata'],
                },
                args: {},
              },
            },
          },
        },
      },
    },
  },
};

module.exports = apis;
