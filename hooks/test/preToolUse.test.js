const PreToolUseHook = require('../preToolUse');
const HookBase = require('../core/HookBase');
const Security = require('../utils/Security');

// Mock dependencies
jest.mock('../core/HookBase');
jest.mock('../utils/Security');

describe('PreToolUseHook', () => {
  let hook;
  let mockConfig;
  let mockLogger;
  let mockEventSender;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      getAgentId: jest.fn().mockReturnValue('test-agent-1'),
      getSessionId: jest.fn().mockReturnValue('test-session-1'),
      getProjectPath: jest.fn().mockReturnValue('/test/project'),
      isSecurityEnabled: jest.fn().mockReturnValue(true)
    };

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      logError: jest.fn()
    };

    // Setup mock event sender
    mockEventSender = {
      sendEvent: jest.fn().mockResolvedValue({ success: true })
    };

    // Mock HookBase constructor
    HookBase.mockImplementation(function(hookType) {
      this.hookType = hookType;
      this.config = mockConfig;
      this.logger = mockLogger;
      this.eventSender = mockEventSender;
    });

    // Mock Security methods
    Security.validateTool = jest.fn().mockReturnValue({ valid: true, reason: null });
    Security.validateCommand = jest.fn().mockReturnValue({ valid: true, reason: null });
    Security.validateFilePath = jest.fn().mockReturnValue({ valid: true, reason: null });
    Security.sanitizeForLogging = jest.fn().mockImplementation(data => data);

    hook = new PreToolUseHook();
  });

  describe('constructor', () => {
    it('should initialize with pre_tool_use hook type', () => {
      expect(hook.hookType).toBe('pre_tool_use');
    });

    it('should call parent constructor', () => {
      expect(HookBase).toHaveBeenCalledWith('pre_tool_use');
    });
  });

  describe('validateInput', () => {
    it('should validate valid pre-tool input', async () => {
      const validInput = {
        source_app: 'claude-code',
        session_id: 'test-session',
        hook_event_type: 'pre_tool_use',
        payload: {
          tool_name: 'Edit',
          tool_input: { file_path: '/test/file.txt' },
          command: 'edit file',
          file_path: '/test/file.txt',
          working_directory: '/test',
          environment: { NODE_ENV: 'test' }
        },
        timestamp: Date.now(),
        chat: []
      };

      const result = await hook.validateInput(validInput);
      expect(result).toEqual(validInput);
    });

    it('should accept minimal input', async () => {
      const minimalInput = {
        payload: {
          tool_name: 'Edit'
        }
      };

      const result = await hook.validateInput(minimalInput);
      expect(result).toEqual(minimalInput);
    });

    it('should reject invalid input types', async () => {
      const invalidInput = {
        payload: {
          tool_name: 123 // Should be string
        }
      };

      await expect(hook.validateInput(invalidInput)).rejects.toThrow();
    });
  });

  describe('performSecurityValidation', () => {
    it('should skip validation when security is disabled', async () => {
      mockConfig.isSecurityEnabled.mockReturnValue(false);

      const input = {
        payload: {
          tool_name: 'Bash',
          command: 'rm -rf *'
        }
      };

      await expect(hook.performSecurityValidation(input)).resolves.not.toThrow();
    });

    it('should validate tool when security is enabled', async () => {
      const input = {
        payload: {
          tool_name: 'Edit'
        }
      };

      await hook.performSecurityValidation(input);

      expect(Security.validateTool).toHaveBeenCalledWith('Edit');
    });

    it('should validate command when present', async () => {
      const input = {
        payload: {
          tool_name: 'Bash',
          command: 'ls -la'
        }
      };

      await hook.performSecurityValidation(input);

      expect(Security.validateCommand).toHaveBeenCalledWith('ls -la');
    });

    it('should validate file path when present', async () => {
      const input = {
        payload: {
          tool_name: 'Edit',
          file_path: '/test/file.txt'
        }
      };

      await hook.performSecurityValidation(input);

      expect(Security.validateFilePath).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should throw error when tool is blocked', async () => {
      Security.validateTool.mockReturnValue({
        valid: false,
        reason: 'Tool is restricted'
      });

      const input = {
        payload: {
          tool_name: 'RestrictedTool'
        }
      };

      await expect(hook.performSecurityValidation(input)).rejects.toThrow('Tool blocked: Tool is restricted');
    });

    it('should throw error when command is blocked', async () => {
      Security.validateCommand.mockReturnValue({
        valid: false,
        reason: 'Command is dangerous'
      });

      const input = {
        payload: {
          tool_name: 'Bash',
          command: 'rm -rf *'
        }
      };

      await expect(hook.performSecurityValidation(input)).rejects.toThrow('Command blocked: Command is dangerous');
    });

    it('should throw error when file path is blocked', async () => {
      Security.validateFilePath.mockReturnValue({
        valid: false,
        reason: 'File is sensitive'
      });

      const input = {
        payload: {
          tool_name: 'Edit',
          file_path: '/etc/passwd'
        }
      };

      await expect(hook.performSecurityValidation(input)).rejects.toThrow('File access blocked: File is sensitive');
    });
  });

  describe('validateToolSpecificRestrictions', () => {
    it('should validate Bash tool restrictions', async () => {
      const spy = jest.spyOn(hook, 'validateBashTool').mockResolvedValue();

      const payload = {
        tool_name: 'Bash',
        command: 'ls -la'
      };

      await hook.validateToolSpecificRestrictions(payload);

      expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should validate Edit tool restrictions', async () => {
      const spy = jest.spyOn(hook, 'validateEditTool').mockResolvedValue();

      const payload = {
        tool_name: 'Edit',
        file_path: '/test/file.txt'
      };

      await hook.validateToolSpecificRestrictions(payload);

      expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should validate Read tool restrictions', async () => {
      const spy = jest.spyOn(hook, 'validateReadTool').mockResolvedValue();

      const payload = {
        tool_name: 'Read',
        file_path: '/test/file.txt'
      };

      await hook.validateToolSpecificRestrictions(payload);

      expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should validate NetworkRequest tool restrictions', async () => {
      const spy = jest.spyOn(hook, 'validateNetworkTool').mockResolvedValue();

      const payload = {
        tool_name: 'NetworkRequest',
        url: 'http://example.com'
      };

      await hook.validateToolSpecificRestrictions(payload);

      expect(spy).toHaveBeenCalledWith(payload);
    });

    it('should allow unknown tools by default', async () => {
      const payload = {
        tool_name: 'UnknownTool'
      };

      await expect(hook.validateToolSpecificRestrictions(payload)).resolves.not.toThrow();
    });
  });

  describe('validateBashTool', () => {
    it('should allow safe bash commands', async () => {
      const payload = {
        command: 'ls -la'
      };

      await expect(hook.validateBashTool(payload)).resolves.not.toThrow();
    });

    it('should block dangerous bash commands', async () => {
      const dangerousCommands = [
        'su root',
        'sudo su -',
        'chroot /new/root',
        'mount /dev/sda1',
        'umount /dev/sda1',
        'iptables -F',
        'ufw --force reset',
        'systemctl stop nginx',
        'service apache2 stop',
        'docker run --privileged',
        'kubectl delete pod'
      ];

      for (const command of dangerousCommands) {
        const payload = { command };
        await expect(hook.validateBashTool(payload)).rejects.toThrow('Bash command blocked');
      }
    });

    it('should handle missing command gracefully', async () => {
      const payload = {};
      await expect(hook.validateBashTool(payload)).resolves.not.toThrow();
    });

    it('should check tool_input for command', async () => {
      const payload = {
        tool_input: {
          command: 'su root'
        }
      };

      await expect(hook.validateBashTool(payload)).rejects.toThrow('Bash command blocked');
    });
  });

  describe('validateEditTool', () => {
    it('should allow safe file edits', async () => {
      const payload = {
        file_path: '/home/user/document.txt'
      };

      await expect(hook.validateEditTool(payload)).resolves.not.toThrow();
    });

    it('should block dangerous file edits', async () => {
      const dangerousFiles = [
        '/etc/passwd',
        '/usr/bin/sudo',
        '/usr/sbin/init',
        '/sbin/init',
        '/lib/systemd/systemd',
        '/var/www/index.html',
        '/home/user/.bashrc',
        '/home/user/.bash_profile',
        '/home/user/.profile',
        '/home/user/.ssh/authorized_keys',
        '/home/user/.ssh/known_hosts'
      ];

      for (const file_path of dangerousFiles) {
        const payload = { file_path };
        await expect(hook.validateEditTool(payload)).rejects.toThrow('Edit access blocked');
      }
    });

    it('should handle missing file path gracefully', async () => {
      const payload = {};
      await expect(hook.validateEditTool(payload)).resolves.not.toThrow();
    });

    it('should check tool_input for file_path', async () => {
      const payload = {
        tool_input: {
          file_path: '/etc/passwd'
        }
      };

      await expect(hook.validateEditTool(payload)).rejects.toThrow('Edit access blocked');
    });
  });

  describe('validateReadTool', () => {
    it('should allow reading normal files', async () => {
      const fs = require('fs');
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 });

      const payload = {
        file_path: '/home/user/document.txt'
      };

      await expect(hook.validateReadTool(payload)).resolves.not.toThrow();
    });

    it('should block reading very large files', async () => {
      const fs = require('fs');
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 20 * 1024 * 1024 }); // 20MB

      const payload = {
        file_path: '/home/user/large_file.txt'
      };

      await expect(hook.validateReadTool(payload)).rejects.toThrow('File too large');
    });

    it('should handle non-existent files gracefully', async () => {
      const fs = require('fs');
      jest.spyOn(fs, 'statSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const payload = {
        file_path: '/nonexistent/file.txt'
      };

      await expect(hook.validateReadTool(payload)).resolves.not.toThrow();
    });

    it('should handle missing file path gracefully', async () => {
      const payload = {};
      await expect(hook.validateReadTool(payload)).resolves.not.toThrow();
    });

    it('should check tool_input for file_path', async () => {
      const fs = require('fs');
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 20 * 1024 * 1024 }); // 20MB

      const payload = {
        tool_input: {
          file_path: '/large_file.txt'
        }
      };

      await expect(hook.validateReadTool(payload)).rejects.toThrow('File too large');
    });
  });

  describe('validateNetworkTool', () => {
    it('should allow external network requests', async () => {
      const payload = {
        url: 'https://api.example.com/data'
      };

      await expect(hook.validateNetworkTool(payload)).resolves.not.toThrow();
    });

    it('should block internal network requests', async () => {
      const internalUrls = [
        'http://localhost:8080',
        'https://127.0.0.1:3000',
        'http://192.168.1.1',
        'https://10.0.0.1:8080',
        'http://172.16.0.1',
        'https://169.254.1.1',
        'http://0.0.0.0:8080',
        'https://internal.com:8080'
      ];

      for (const url of internalUrls) {
        const payload = { url };
        await expect(hook.validateNetworkTool(payload)).rejects.toThrow('Internal network request blocked');
      }
    });

    it('should handle missing URL gracefully', async () => {
      const payload = {};
      await expect(hook.validateNetworkTool(payload)).resolves.not.toThrow();
    });

    it('should check tool_input for URL', async () => {
      const payload = {
        tool_input: {
          url: 'http://localhost:8080'
        }
      };

      await expect(hook.validateNetworkTool(payload)).rejects.toThrow('Internal network request blocked');
    });
  });

  describe('processHook', () => {
    it('should process valid tool usage', async () => {
      const input = {
        payload: {
          tool_name: 'Edit',
          tool_input: { file_path: '/test/file.txt' },
          command: 'edit file',
          file_path: '/test/file.txt',
          working_directory: '/test',
          environment: { NODE_ENV: 'test' }
        }
      };

      const result = await hook.processHook(input);

      expect(result).toEqual({
        hookType: 'pre_tool_use',
        eventType: 'tool.pre_use',
        toolName: 'Edit',
        toolInput: { file_path: '/test/file.txt' },
        command: 'edit file',
        filePath: '/test/file.txt',
        workingDirectory: '/test',
        environment: ['NODE_ENV'],
        validationResult: 'approved',
        timestamp: expect.any(String),
        sessionId: 'test-session-1',
        summary: expect.any(Object)
      });
    });

    it('should handle missing payload', async () => {
      const input = {};

      const result = await hook.processHook(input);

      expect(result.toolName).toBeUndefined();
      expect(result.validationResult).toBe('approved');
    });

    it('should log tool usage', async () => {
      const input = {
        payload: {
          tool_name: 'Edit',
          file_path: '/test/file.txt'
        }
      };

      await hook.processHook(input);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Tool validation passed: Edit',
        expect.objectContaining({
          toolInfo: expect.any(Object),
          validationTime: expect.any(Number)
        })
      );
    });
  });

  describe('generateSummary', () => {
    it('should generate comprehensive summary', () => {
      const input = {
        payload: {
          tool_name: 'Edit',
          command: 'edit file',
          file_path: '/test/file.txt'
        }
      };

      const summary = hook.generateSummary(input);

      expect(summary).toEqual({
        action: 'tool_validation',
        toolName: 'Edit',
        approved: true,
        timestamp: expect.any(String),
        command: 'edit file',
        filePath: '/test/file.txt'
      });
    });

    it('should truncate long commands', () => {
      const longCommand = 'x'.repeat(150);
      const input = {
        payload: {
          tool_name: 'Bash',
          command: longCommand
        }
      };

      const summary = hook.generateSummary(input);

      expect(summary.command).toBe(longCommand.substring(0, 100));
    });

    it('should handle missing payload', () => {
      const input = {};

      const summary = hook.generateSummary(input);

      expect(summary.toolName).toBeUndefined();
      expect(summary.approved).toBe(true);
    });
  });
});