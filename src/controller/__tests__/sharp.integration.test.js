/**
 * Integration tests for Sharp Controller
 * These tests use the real Sharp library to verify the memory leak fix
 */
const sharp = require('sharp');

describe('Sharp Controller Integration', () => {
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

  describe('Memory Management', () => {
    test('should properly clean up Sharp resources after processing', async () => {
      // Get initial counters
      const countersBefore = sharp.counters();
      
      // Make a request to process an image
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
      
      // Get counters after processing
      const countersAfter = sharp.counters();
      
      // Queue and process counters should be 0 after cleanup
      expect(countersAfter.queue).toBe(0);
      expect(countersAfter.process).toBe(0);
    });

    test('should handle multiple sequential requests without memory accumulation', async () => {
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
      
      // Verify counters are clean after multiple requests
      const counters = sharp.counters();
      expect(counters.queue).toBe(0);
      expect(counters.process).toBe(0);
    });
  });

  describe('Image Processing Functionality', () => {
    test('should convert image to PNG format', async () => {
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
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('image');
      expect(body).toHaveProperty('info');
      expect(body.info.format).toBe('png');
    });

    test('should resize and convert image', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/sharp',
        payload: {
          image: sampleBase64Image,
          tasks: [
            { kind: 'resize', args: { width: 50, height: 50 } },
            { kind: 'png', args: {} },
            { kind: 'toBuffer', args: { resolveWithObject: true } }
          ]
        }
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.info.width).toBe(50);
      expect(body.info.height).toBe(50);
    });
  });
});
