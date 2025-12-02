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

  const sharpInstance = sharp(Buffer.from(imageBase64, 'base64'));
  let pipeline = sharpInstance;
  try {
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
  } finally {
    // Destroy the Sharp instance to release native memory and prevent memory leaks
    try {
      sharpInstance.destroy();
    } catch (_) {
      // Ignore destroy errors to avoid masking the original error
    }
  }
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
        example: {
          image:
            'UklGRlADAABXRUJQVlA4IEQDAAAQGwCdASqBAHsAP83a52o/tTAorHW7Q/A5iWwA1BJWaE1pZ3bveU5yizgHb7SKLILw+CBCVrqu7bWt7YJFMpxDwHxhG1Gzgb+DQlxYIvqGiLprt9rRbtNtQ1IDDEicmsyWL7foIjMZd1XzLjN9ZEGUUHd6vyQMV5XQBw8Qro41ysLVqeuR3zS2dheapdd2ZfmVDIVR/gNbXnLvajqNzQP6RzFYcXG9+6uQvS8woWeUdsGZWs1zMlccbdCe0NQYQCHiUqvHMq0dWqvFAJaLKac/nZI4Oy3oCREHt6SyAtBXRAAA/u2oAAH99LR7rCbbgcHOJ7qPG9R6n41JtS0bDurgAhjYNrUg1DiS9DNZZ1kWyowfJHPzoKyvthELEIyL03dIXQFZfjse+G46DUQBtR4BBpBWqAYKMHq9MQzK1dTe8/2eeGwoRjvC+BoWNmI/+7sVP8Qtwbj4Fgo7mpjodXfopm8oR4zZmOg2BR+ykhcQydyacv9N3JunwF4JBCZEQH4HozwD6sbNH7TAErTTeNHWyVQAoQC4biHlJPX4YS4QfUw5M9f6El+bE3blgs0NbPJyXTxhem6D5PvTNO5Tpjf9JfuRO99Qqdgip39PMv9yJPPkAANhjuujW1uFVCGxttLsISQyDOin2ujJs26XG00TyOon4BVl5dgqHJPn5fJM0ym3U1T+JzM+97guVbznfbxS6mUh+T6achQCqG3LW/UefYxz19jawMKRMqEoophaQQulTU0Pqo4zC8vyIKzAFs2fqBc+w9JrcwT0tOLXPWZmF5hkjbwHlwFUa6c/p52Db9qWGXutY9ppfwViRchgmPfzQZVPUF9RFob7Ct8ej6yAY9qeChSL6vKTyOqRZGXW4O5eeUGLlTzbgVBS14duDxK0lnEA9N2YQ6l3rIAwdw8DXcSwbhkuo2qfwb5nkSemK+lh0ugypQc53UTCDFQETxY23jaM8oJadYRAceFD2NnTC5Z72Sna/wKIp4Z1cBCFqteX/FnOldnZu9/tts7STWJdA3vOrH9Bfi1LAzTTIKKkP3uk6r6KtwAYxvD4jp7Hk4R6GkWKqnai+kJWDMYJaBum5DBAOrkZqtFWWKAZMaSgaT6AAA==',
          tasks: [
            {
              kind: 'png',
              args: { quality: 100 },
            },
            {
              kind: 'toBuffer',
              args: { resolveWithObject: true },
            },
          ],
        },
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
