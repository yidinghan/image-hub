const sharp = require('sharp');

const taskKindFns = {
  /**
   * @param {import('sharp').Sharp} pipeline
   */
  metadata: (pipeline) => {
    return pipeline.metadata();
  },
  /**
   * @param {import('sharp').Sharp} pipeline
   */
  jpeg: (pipeline, args) => {
    return pipeline.jpeg(args);
  },
  /**
   * @param {import('sharp').Sharp} pipeline
   */
  toBuffer: (pipeline, args) => {
    return pipeline.toBuffer(args).then((result) => {
      let data = result;
      let info = undefined;
      if ('info' in data) {
        data = result.data;
        info = result.info;
      }
      return { image: data.toString('base64'), info };
    });
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
                  enum: ['metadata', 'jpeg', 'toBuffer'],
                },
                args: {},
              },
            },
            maxItems: 10,
          },
        },
      },
    },
  },
};

module.exports = apis;
