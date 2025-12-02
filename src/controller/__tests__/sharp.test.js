const sharp = require('sharp');

// Mock sharp module
jest.mock('sharp');

describe('Sharp Controller', () => {
  let mockSharpInstance;
  let mockDestroy;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock destroy function
    mockDestroy = jest.fn();
    
    // Create mock sharp instance with chainable methods
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
    
    // Make sharp return our mock instance
    sharp.mockReturnValue(mockSharpInstance);
  });

  // Sample base64 image (1x1 transparent PNG)
  const sampleBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  describe('Memory Leak Prevention', () => {
    test('should call destroy() on Sharp instance after successful processing', async () => {
      // Re-require the module to get fresh instance with mocked sharp
      jest.resetModules();
      jest.doMock('sharp', () => sharp);
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
      
      // Verify destroy was called
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    test('should call destroy() on Sharp instance even when processing fails', async () => {
      jest.resetModules();
      jest.doMock('sharp', () => sharp);
      
      // Make toBuffer throw an error
      mockSharpInstance.toBuffer = jest.fn().mockRejectedValue(new Error('Processing failed'));
      
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

      await expect(sharpApis.root.handler(mockRequest, mockReply)).rejects.toThrow('Processing failed');
      
      // Verify destroy was still called even after error
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    test('should not throw if destroy() fails', async () => {
      jest.resetModules();
      jest.doMock('sharp', () => sharp);
      
      // Make destroy throw an error
      mockDestroy.mockImplementation(() => {
        throw new Error('Destroy failed');
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

      // Should not throw even if destroy fails
      await expect(sharpApis.root.handler(mockRequest, mockReply)).resolves.not.toThrow();
      
      // Verify destroy was attempted
      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe('Image Processing', () => {
    test('should process image with png conversion', async () => {
      jest.resetModules();
      jest.doMock('sharp', () => sharp);
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
      
      expect(mockSharpInstance.png).toHaveBeenCalledWith({ quality: 100 });
      expect(mockReply.send).toHaveBeenCalled();
    });

    test('should create Sharp instance with buffer from base64 image', async () => {
      jest.resetModules();
      jest.doMock('sharp', () => sharp);
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

      await sharpApis.root.handler(mockRequest, mockReply);
      
      // Verify sharp was called with a Buffer
      expect(sharp).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });
});
