/**
 * 集成测试 - 验证 Sharp Controller 的内存泄漏修复
 * 使用真实的 fastify 应用测试 destroy() 调用行为
 */
const sharp = require('sharp');

describe('Sharp Controller 集成测试 - 内存泄漏修复', () => {
  // Sample base64 encoded WEBP image from the API example
  const sampleBase64Image = 'UklGRlADAABXRUJQVlA4IEQDAAAQGwCdASqBAHsAP83a52o/tTAorHW7Q/A5iWwA1BJWaE1pZ3bveU5yizgHb7SKLILw+CBCVrqu7bWt7YJFMpxDwHxhG1Gzgb+DQlxYIvqGiLprt9rRbtNtQ1IDDEicmsyWL7foIjMZd1XzLjN9ZEGUUHd6vyQMV5XQBw8Qro41ysLVqeuR3zS2dheapdd2ZfmVDIVR/gNbXnLvajqNzQP6RzFYcXG9+6uQvS8woWeUdsGZWs1zMlccbdCe0NQYQCHiUqvHMq0dWqvFAJaLKac/nZI4Oy3oCREHt6SyAtBXRAAA/u2oAAH99LR7rCbbgcHOJ7qPG9R6n41JtS0bDurgAhjYNrUg1DiS9DNZZ1kWyowfJHPzoKyvthELEIyL03dIXQFZfjse+G46DUQBtR4BBpBWqAYKMHq9MQzK1dTe8/2eeGwoRjvC+BoWNmI/+7sVP8Qtwbj4Fgo7mpjodXfopm8oR4zZmOg2BR+ykhcQydyacv9N3JunwF4JBCZEQH4HozwD6sbNH7TAErTTeNHWyVQAoQC4biHlJPX4YS4QfUw5M9f6El+bE3blgs0NbPJyXTxhem6D5PvTNO5Tpjf9JfuRO99Qqdgip39PMv9yJPPkAANhjuujW1uFVCGxttLsISQyDOin2ujJs26XG00TyOon4BVl5dgqHJPn5fJM0ym3U1T+JzM+97guVbznfbxS6mUh+T6achQCqG3LW/UefYxz19jawMKRMqEoophaQQulTU0Pqo4zC8vyIKzAFs2fqBc+w9JrcwT0tOLXPWZmF5hkjbwHlwFUa6c/p52Db9qWGXutY9ppfwViRchgmPfzQZVPUF9RFob7Ct8ej6yAY9qeChSL6vKTyOqRZGXW4O5eeUGLlTzbgVBS14duDxK0lnEA9N2YQ6l3rIAwdw8DXcSwbhkuo2qfwb5nkSemK+lh0ugypQc53UTCDFQETxY23jaM8oJadYRAceFD2NnTC5Z72Sna/wKIp4Z1cBCFqteX/FnOldnZu9/tts7STWJdA3vOrH9Bfi1LAzTTIKKkP3uk6r6KtwAYxvD4jp7Hk4R6GkWKqnai+kJWDMYJaBum5DBAOrkZqtFWWKAZMaSgaT6AAA==';

  let fastify;

  beforeAll(async () => {
    // Disable sharp cache for testing
    sharp.cache(false);
    
    // Import and initialize fastify app
    const { fastify: app } = require('../../../app');
    fastify = app;
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('destroy() 资源释放验证', () => {
    test('请求处理完成后 sharp.counters 应显示资源已释放', async () => {
      // 发起请求处理图片
      const response = await fastify.inject({
        method: 'POST',
        url: '/sharp',
        payload: {
          image: sampleBase64Image,
          tasks: [
            { kind: 'png', args: { quality: 100 } },
            { kind: 'toBuffer', args: { resolveWithObject: true } }
          ]
        }
      });

      expect(response.statusCode).toBe(200);
      
      // 验证 Sharp 资源计数器显示资源已被释放
      // 如果 destroy() 被正确调用，queue 和 process 应该为 0
      const counters = sharp.counters();
      expect(counters.queue).toBe(0);
      expect(counters.process).toBe(0);
    });

    test('多次请求后资源不应累积（验证每次都调用了 destroy）', async () => {
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const response = await fastify.inject({
          method: 'POST',
          url: '/sharp',
          payload: {
            image: sampleBase64Image,
            tasks: [
              { kind: 'png', args: { quality: 80 } },
              { kind: 'toBuffer', args: { resolveWithObject: true } }
            ]
          }
        });
        
        expect(response.statusCode).toBe(200);
      }
      
      // 多次请求后，如果每次都正确调用了 destroy()，
      // 资源计数器仍应为 0，说明没有内存泄漏
      const counters = sharp.counters();
      expect(counters.queue).toBe(0);
      expect(counters.process).toBe(0);
    });
  });
});
