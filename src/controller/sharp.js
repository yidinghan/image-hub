const sharp = require('sharp');

const taskKindFns = {
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
    if (kind in taskKindFns) {
      pipeline = taskKindFns[kind](pipeline, args);
    } else if (kind in pipeline) {
      pipeline = pipeline[kind](args);
    }
  });

  if ('then' in pipeline) {
    // @ts-ignore
    return reply.send(await pipeline.then());
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
                  desciption:
                    '任务类型，具体作用请看官方文档，http://sharp.pixelplumbing.com/en/stable/api-constructor/',
                  // 'body > div.wy-grid-for-nav > section > div > div > div:nth-child(2) > div > h2'
                  // select to craw api fn
                  enum: [
                    'metadata',
                    'stats',
                    // Output
                    'jpeg',
                    'png',
                    'webp',
                    'tiff',
                    'heif',
                    'raw',
                    'tile',
                    'toFormat',
                    'toBuffer',
                    'toFile',
                    // Resizing images
                    'resize',
                    'extend',
                    'extract',
                    'trim',
                    // Compositing images
                    'composite',
                    // Image operations
                    'rotate',
                    'flip',
                    'flop',
                    'sharpen',
                    'median',
                    'blur',
                    'flatten',
                    'gamma',
                    'negate',
                    'normalise',
                    'normalize',
                    'convolve',
                    'threshold',
                    'boolean',
                    'linear',
                    'recomb',
                    'modulate',
                    // Colour manipulation
                    'tint',
                    'greyscale',
                    'grayscale',
                    'tocolourspace',
                    'tocolorspace',
                    // Channel manipulation
                    'removealpha',
                    'ensurealpha',
                    'extractchannel',
                    'joinchannel',
                    'bandbool',
                    // cache
                    'cache',
                    'concurrency',
                    'counters',
                    'simd',
                  ],
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
