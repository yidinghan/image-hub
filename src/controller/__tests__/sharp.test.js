/**
 * 测试 Sharp Controller 的内存泄漏修复
 * 主要验证 try-finally 结构中 destroy() 的调用行为
 */

describe('Sharp Controller - 内存泄漏修复测试', () => {
  // Sample base64 encoded WEBP image
  const sampleBase64Image = 'UklGRlADAABXRUJQVlA4IEQDAAAQGwCdASqBAHsAP83a52o/tTAorHW7Q/A5iWwA1BJWaE1pZ3bveU5yizgHb7SKLILw+CBCVrqu7bWt7YJFMpxDwHxhG1Gzgb+DQlxYIvqGiLprt9rRbtNtQ1IDDEicmsyWL7foIjMZd1XzLjN9ZEGUUHd6vyQMV5XQBw8Qro41ysLVqeuR3zS2dheapdd2ZfmVDIVR/gNbXnLvajqNzQP6RzFYcXG9+6uQvS8woWeUdsGZWs1zMlccbdCe0NQYQCHiUqvHMq0dWqvFAJaLKac/nZI4Oy3oCREHt6SyAtBXRAAA/u2oAAH99LR7rCbbgcHOJ7qPG9R6n41JtS0bDurgAhjYNrUg1DiS9DNZZ1kWyowfJHPzoKyvthELEIyL03dIXQFZfjse+G46DUQBtR4BBpBWqAYKMHq9MQzK1dTe8/2eeGwoRjvC+BoWNmI/+7sVP8Qtwbj4Fgo7mpjodXfopm8oR4zZmOg2BR+ykhcQydyacv9N3JunwF4JBCZEQH4HozwD6sbNH7TAErTTeNHWyVQAoQC4biHlJPX4YS4QfUw5M9f6El+bE3blgs0NbPJyXTxhem6D5PvTNO5Tpjf9JfuRO99Qqdgip39PMv9yJPPkAANhjuujW1uFVCGxttLsISQyDOin2ujJs26XG00TyOon4BVl5dgqHJPn5fJM0ym3U1T+JzM+97guVbznfbxS6mUh+T6achQCqG3LW/UefYxz19jawMKRMqEoophaQQulTU0Pqo4zC8vyIKzAFs2fqBc+w9JrcwT0tOLXPWZmF5hkjbwHlwFUa6c/p52Db9qWGXutY9ppfwViRchgmPfzQZVPUF9RFob7Ct8ej6yAY9qeChSL6vKTyOqRZGXW4O5eeUGLlTzbgVBS14duDxK0lnEA9N2YQ6l3rIAwdw8DXcSwbhkuo2qfwb5nkSemK+lh0ugypQc53UTCDFQETxY23jaM8oJadYRAceFD2NnTC5Z72Sna/wKIp4Z1cBCFqteX/FnOldnZu9/tts7STWJdA3vOrH9Bfi1LAzTTIKKkP3uk6r6KtwAYxvD4jp7Hk4R6GkWKqnai+kJWDMYJaBum5DBAOrkZqtFWWKAZMaSgaT6AAA==';

  let mockDestroy;
  let mockSharpInstance;

  beforeEach(() => {
    jest.resetModules();
    
    // 创建 mock destroy 函数来追踪调用
    mockDestroy = jest.fn();
    
    // 创建 mock sharp 实例
    mockSharpInstance = {
      destroy: mockDestroy,
      png: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue({
        data: Buffer.from('test-image-data'),
        info: { format: 'png', width: 100, height: 100 }
      }),
    };
    
    // Mock sharp module
    jest.doMock('sharp', () => jest.fn(() => mockSharpInstance));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('try-finally 结构中的 destroy() 调用', () => {
    test('处理成功后应调用 destroy() 释放资源', async () => {
      const sharpApis = require('../sharp');
      
      const mockRequest = {
        body: {
          image: sampleBase64Image,
          tasks: [
            { kind: 'png', args: { quality: 100 } },
            { kind: 'toBuffer', args: { resolveWithObject: true } }
          ]
        }
      };
      
      const mockReply = {
        send: jest.fn()
      };

      await sharpApis.root.handler(mockRequest, mockReply);
      
      // 验证 destroy 被调用了一次
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    test('处理失败时 finally 块仍应调用 destroy()', async () => {
      // 让 toBuffer 抛出错误
      mockSharpInstance.toBuffer = jest.fn().mockRejectedValue(new Error('处理失败'));
      
      const sharpApis = require('../sharp');
      
      const mockRequest = {
        body: {
          image: sampleBase64Image,
          tasks: [
            { kind: 'png', args: {} },
            { kind: 'toBuffer', args: { resolveWithObject: true } }
          ]
        }
      };
      
      const mockReply = {
        send: jest.fn()
      };

      // 处理应该抛出错误
      await expect(sharpApis.root.handler(mockRequest, mockReply)).rejects.toThrow('处理失败');
      
      // 即使发生错误，destroy 仍应被调用（finally 块保证）
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    test('destroy() 抛出异常时不应影响正常处理结果', async () => {
      // 让 destroy 抛出错误
      mockDestroy.mockImplementation(() => {
        throw new Error('destroy 失败');
      });
      
      const sharpApis = require('../sharp');
      
      const mockRequest = {
        body: {
          image: sampleBase64Image,
          tasks: [
            { kind: 'png', args: { quality: 100 } },
            { kind: 'toBuffer', args: { resolveWithObject: true } }
          ]
        }
      };
      
      const mockReply = {
        send: jest.fn()
      };

      // 即使 destroy 失败，处理也不应抛出错误（try-catch 在 finally 中捕获）
      await expect(sharpApis.root.handler(mockRequest, mockReply)).resolves.not.toThrow();
      
      // 验证 destroy 被尝试调用
      expect(mockDestroy).toHaveBeenCalledTimes(1);
      // 验证正常返回了结果
      expect(mockReply.send).toHaveBeenCalled();
    });

    test('destroy() 异常不应掩盖原始处理错误', async () => {
      // 让处理失败
      mockSharpInstance.toBuffer = jest.fn().mockRejectedValue(new Error('原始错误'));
      // 让 destroy 也失败
      mockDestroy.mockImplementation(() => {
        throw new Error('destroy 错误');
      });
      
      const sharpApis = require('../sharp');
      
      const mockRequest = {
        body: {
          image: sampleBase64Image,
          tasks: [
            { kind: 'toBuffer', args: {} }
          ]
        }
      };
      
      const mockReply = {
        send: jest.fn()
      };

      // 应该抛出原始错误，而不是 destroy 的错误
      await expect(sharpApis.root.handler(mockRequest, mockReply)).rejects.toThrow('原始错误');
      
      // destroy 仍被尝试调用
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });
  });
});
