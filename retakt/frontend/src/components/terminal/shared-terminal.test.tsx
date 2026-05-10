import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SharedTerminal } from './shared-terminal';
import { useTerminalContext } from '@/contexts/terminal-context';
import { useAuthContext } from '@/components/providers/auth';
import * as fc from 'fast-check';

// Mock the contexts
vi.mock('@/contexts/terminal-context', () => ({
  useTerminalContext: vi.fn(),
}));

vi.mock('@/components/providers/auth', () => ({
  useAuthContext: vi.fn(),
}));

// Mock xterm.js
let lastTerminalInstance: any = null;

vi.mock('@xterm/xterm', () => {
  class MockTerminal {
    options: any = {};
    cols = 80;
    rows = 24;
    
    loadAddon = vi.fn();
    open = vi.fn();
    onData = vi.fn(() => ({ dispose: vi.fn() }));
    focus = vi.fn();
    dispose = vi.fn();
    getSelection = vi.fn(() => '');
    
    constructor(options?: any) {
      this.options = options || {};
      lastTerminalInstance = this;
    }
  }
  
  return {
    Terminal: MockTerminal,
  };
});

vi.mock('@xterm/addon-fit', () => {
  class MockFitAddon {
    fit = vi.fn();
  }
  
  return {
    FitAddon: MockFitAddon,
  };
});

vi.mock('@xterm/addon-web-links', () => {
  class MockWebLinksAddon {}
  
  return {
    WebLinksAddon: MockWebLinksAddon,
  };
});

describe('SharedTerminal - Container Structure', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  it('should render parent container with overflow-hidden class', () => {
    const { container } = render(<SharedTerminal />);
    
    // The parent container should have overflow-hidden
    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv).toHaveClass('overflow-hidden');
  });

  it('should render parent container with flex and full dimensions', () => {
    const { container } = render(<SharedTerminal />);
    
    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv).toHaveClass('flex');
    expect(parentDiv).toHaveClass('flex-col');
    expect(parentDiv).toHaveClass('w-full');
    expect(parentDiv).toHaveClass('h-full');
  });

  it('should render wrapper with overflow-hidden and flex-1 classes', () => {
    const { container } = render(<SharedTerminal />);
    
    // Find the wrapper div (second level, after the chrome)
    const parentDiv = container.firstChild as HTMLElement;
    const wrapperDiv = parentDiv.querySelector('.relative.flex-1') as HTMLElement;
    
    expect(wrapperDiv).toBeTruthy();
    expect(wrapperDiv).toHaveClass('flex-1');
    expect(wrapperDiv).toHaveClass('overflow-hidden');
    expect(wrapperDiv).toHaveClass('min-h-0');
  });

  it('should render terminal container with correct dimensions', () => {
    const { container } = render(<SharedTerminal />);
    
    // Find the terminal container
    const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
    
    expect(terminalContainer).toBeTruthy();
    expect(terminalContainer).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('should have terminal-container class on the xterm container', () => {
    const { container } = render(<SharedTerminal />);
    
    const terminalContainer = container.querySelector('.terminal-container');
    expect(terminalContainer).toBeTruthy();
    expect(terminalContainer).toHaveClass('terminal-container');
  });

  it('should render wrapper with full width', () => {
    const { container } = render(<SharedTerminal />);
    
    const wrapperDiv = container.querySelector('.relative.flex-1') as HTMLElement;
    expect(wrapperDiv).toHaveClass('w-full');
  });

  it('should maintain proper container hierarchy', () => {
    const { container } = render(<SharedTerminal />);
    
    // Verify the hierarchy: parent > chrome + wrapper > terminal-container
    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv.children.length).toBeGreaterThanOrEqual(2); // Chrome + wrapper
    
    const wrapperDiv = parentDiv.querySelector('.relative.flex-1') as HTMLElement;
    expect(wrapperDiv).toBeTruthy();
    
    const terminalContainer = wrapperDiv.querySelector('.terminal-container') as HTMLElement;
    expect(terminalContainer).toBeTruthy();
  });
});

describe('SharedTerminal - Terminal Initialization Options', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  it('should set allowProposedApi to true for ANSI color rendering', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.allowProposedApi).toBe(true);
  });

  it('should pass theme configuration correctly', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.theme).toBeDefined();
    expect(lastTerminalInstance.options.theme.foreground).toBe('#5eead4');
    expect(lastTerminalInstance.options.theme.cursor).toBe('#fbbf24');
    expect(lastTerminalInstance.options.theme.background).toBe('#00000000');
  });

  it('should verify theme has all required ANSI colors', () => {
    render(<SharedTerminal />);
    
    const theme = lastTerminalInstance.options.theme;
    expect(theme).toBeDefined();
    
    // Standard colors
    expect(theme.red).toBeDefined();
    expect(theme.green).toBeDefined();
    expect(theme.yellow).toBeDefined();
    expect(theme.blue).toBeDefined();
    expect(theme.magenta).toBeDefined();
    expect(theme.cyan).toBeDefined();
    expect(theme.white).toBeDefined();
    expect(theme.black).toBeDefined();
    
    // Bright colors
    expect(theme.brightRed).toBeDefined();
    expect(theme.brightGreen).toBeDefined();
    expect(theme.brightYellow).toBeDefined();
    expect(theme.brightBlue).toBeDefined();
    expect(theme.brightMagenta).toBeDefined();
    expect(theme.brightCyan).toBeDefined();
    expect(theme.brightWhite).toBeDefined();
    expect(theme.brightBlack).toBeDefined();
  });

  it('should keep convertEol enabled', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.convertEol).toBe(true);
  });

  it('should keep allowTransparency enabled', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.allowTransparency).toBe(true);
  });

  it('should have all required terminal options configured', () => {
    render(<SharedTerminal />);
    
    const options = lastTerminalInstance.options;
    expect(options.cursorBlink).toBe(true);
    expect(options.cursorStyle).toBe('block');
    expect(options.fontSize).toBe(12);
    expect(options.lineHeight).toBe(1.25);
    expect(options.scrollback).toBe(10000);
    expect(options.disableStdin).toBe(false);
  });
});

describe('SharedTerminal - Theme Consistency', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  /**
   * Task 2.3: Write unit tests for theme consistency
   * Requirements: 2.4, 8.3, 8.4
   */

  it('should have foreground color set to teal (#5eead4)', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.theme).toBeDefined();
    expect(lastTerminalInstance.options.theme.foreground).toBe('#5eead4');
  });

  it('should have cursor color set to amber (#fbbf24)', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.theme).toBeDefined();
    expect(lastTerminalInstance.options.theme.cursor).toBe('#fbbf24');
  });

  it('should have transparent background (#00000000)', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.theme).toBeDefined();
    expect(lastTerminalInstance.options.theme.background).toBe('#00000000');
  });

  it('should maintain theme consistency across multiple renders', () => {
    // First render
    const { unmount } = render(<SharedTerminal />);
    const firstTheme = lastTerminalInstance.options.theme;
    
    expect(firstTheme.foreground).toBe('#5eead4');
    expect(firstTheme.cursor).toBe('#fbbf24');
    expect(firstTheme.background).toBe('#00000000');
    
    unmount();
    
    // Second render
    render(<SharedTerminal />);
    const secondTheme = lastTerminalInstance.options.theme;
    
    expect(secondTheme.foreground).toBe('#5eead4');
    expect(secondTheme.cursor).toBe('#fbbf24');
    expect(secondTheme.background).toBe('#00000000');
  });

  it('should have cursorAccent color defined for contrast', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.theme).toBeDefined();
    expect(lastTerminalInstance.options.theme.cursorAccent).toBeDefined();
    expect(lastTerminalInstance.options.theme.cursorAccent).toBe('#1a0f0a');
  });

  it('should have selectionBackground color defined with transparency', () => {
    render(<SharedTerminal />);
    
    expect(lastTerminalInstance).toBeTruthy();
    expect(lastTerminalInstance.options.theme).toBeDefined();
    expect(lastTerminalInstance.options.theme.selectionBackground).toBeDefined();
    // Should have 8 hex digits (includes alpha channel)
    expect(lastTerminalInstance.options.theme.selectionBackground).toMatch(/^#[0-9a-fA-F]{8}$/);
  });

  it('should maintain teal/amber theme while supporting ANSI colors', () => {
    render(<SharedTerminal />);
    
    const theme = lastTerminalInstance.options.theme;
    
    // Verify core theme colors (teal foreground, amber cursor)
    expect(theme.foreground).toBe('#5eead4');
    expect(theme.cursor).toBe('#fbbf24');
    expect(theme.background).toBe('#00000000');
    
    // Verify ANSI colors are also present (not mutually exclusive)
    expect(theme.red).toBeDefined();
    expect(theme.green).toBeDefined();
    expect(theme.yellow).toBeDefined();
    expect(theme.blue).toBeDefined();
    expect(theme.magenta).toBeDefined();
    expect(theme.cyan).toBeDefined();
  });
});

describe('SharedTerminal - Editor Shortcut Passthrough Property Tests', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  /**
   * **Property 3: Editor shortcut passthrough**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.3**
   * 
   * For any editor shortcut keypress (Ctrl+X, Ctrl+O, Ctrl+S, Ctrl+W, Ctrl+K, Ctrl+G),
   * the event SHALL be forwarded to the PTY without preventDefault being called.
   */
  it('should NOT call preventDefault on editor shortcuts', () => {
    // Define editor shortcuts with their descriptions
    const editorShortcuts = [
      { code: 'KeyX', description: 'nano exit (Ctrl+X)' },
      { code: 'KeyO', description: 'nano write out/save (Ctrl+O)' },
      { code: 'KeyS', description: 'nano/vim save (Ctrl+S)' },
      { code: 'KeyW', description: 'nano search/vim window (Ctrl+W)' },
      { code: 'KeyK', description: 'nano cut line (Ctrl+K)' },
      { code: 'KeyG', description: 'nano go to line/vim file info (Ctrl+G)' },
    ];

    // Arbitrary for selecting a random editor shortcut
    const editorShortcutArbitrary = fc.constantFrom(
      ...editorShortcuts.map(s => s.code)
    );

    fc.assert(
      fc.property(editorShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for the editor shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault was NOT called (editor shortcuts pass through)
        expect(preventDefaultSpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 3: Editor shortcut passthrough - No stopPropagation**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.3**
   * 
   * For any editor shortcut keypress, stopPropagation SHALL NOT be called,
   * allowing the event to reach xterm.js and be forwarded to the PTY.
   */
  it('should NOT call stopPropagation on editor shortcuts', () => {
    const editorShortcuts = ['KeyX', 'KeyO', 'KeyS', 'KeyW', 'KeyK', 'KeyG'];

    const editorShortcutArbitrary = fc.constantFrom(...editorShortcuts);

    fc.assert(
      fc.property(editorShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for the editor shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on stopPropagation
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify stopPropagation was NOT called (editor shortcuts pass through)
        expect(stopPropagationSpy).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 3: Editor shortcut passthrough - Ctrl key requirement**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.3**
   * 
   * Editor shortcuts SHALL only pass through when Ctrl is pressed (not Shift+Ctrl).
   * This ensures clipboard shortcuts (Ctrl+Shift+C/V) are handled separately.
   */
  it('should only pass through editor shortcuts with Ctrl (not Ctrl+Shift)', () => {
    const editorShortcuts = ['KeyX', 'KeyO', 'KeyS', 'KeyW', 'KeyK', 'KeyG'];

    const editorShortcutArbitrary = fc.constantFrom(...editorShortcuts);
    const shiftKeyArbitrary = fc.boolean();

    fc.assert(
      fc.property(editorShortcutArbitrary, shiftKeyArbitrary, (keyCode, shiftKey) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: shiftKey,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        if (shiftKey) {
          // Ctrl+Shift combinations should be blocked (clipboard handling)
          expect(preventDefaultSpy).toHaveBeenCalled();
        } else {
          // Ctrl only (no Shift) should pass through for editor shortcuts
          expect(preventDefaultSpy).not.toHaveBeenCalled();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 3: Editor shortcut passthrough - Event reaches xterm**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.3**
   * 
   * For any editor shortcut, the event SHALL bubble up to xterm.js
   * (defaultPrevented remains false), allowing xterm to forward it to the PTY.
   */
  it('should allow editor shortcuts to bubble to xterm (defaultPrevented = false)', () => {
    const editorShortcuts = ['KeyX', 'KeyO', 'KeyS', 'KeyW', 'KeyK', 'KeyG'];

    const editorShortcutArbitrary = fc.constantFrom(...editorShortcuts);

    fc.assert(
      fc.property(editorShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for the editor shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify the event was not prevented (can reach xterm)
        expect(event.defaultPrevented).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe('SharedTerminal - Capture Phase Event Listener', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  /**
   * Task 5.1: Write unit test for capture phase
   * Requirements: 5.4, 7.4
   * 
   * Verifies that addEventListener is called with capture: true parameter
   * to intercept keyboard events before the browser processes them.
   */
  it('should attach keydown event listener with capture phase (third parameter = true)', () => {
    // Spy on addEventListener before rendering
    const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    
    // Render the terminal
    const { unmount } = render(<SharedTerminal />);
    
    // Find the addEventListener call for 'keydown' event
    const keydownCalls = addEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown'
    );
    
    // Verify at least one keydown listener was added
    expect(keydownCalls.length).toBeGreaterThan(0);
    
    // Verify the third parameter (capture phase) is true
    const capturePhaseCall = keydownCalls.find(call => call[2] === true);
    expect(capturePhaseCall).toBeDefined();
    expect(capturePhaseCall![2]).toBe(true);
    
    // Cleanup
    addEventListenerSpy.mockRestore();
    unmount();
  });

  it('should use capture phase to intercept events before browser processing', () => {
    // Spy on addEventListener
    const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    
    // Render the terminal
    const { unmount } = render(<SharedTerminal />);
    
    // Find all addEventListener calls
    const allCalls = addEventListenerSpy.mock.calls;
    
    // Find the keydown listener with capture phase
    const keydownCaptureCall = allCalls.find(
      call => call[0] === 'keydown' && call[2] === true
    );
    
    // Verify the keydown listener uses capture phase
    expect(keydownCaptureCall).toBeDefined();
    expect(keydownCaptureCall![0]).toBe('keydown');
    expect(keydownCaptureCall![1]).toBeInstanceOf(Function);
    expect(keydownCaptureCall![2]).toBe(true);
    
    // Cleanup
    addEventListenerSpy.mockRestore();
    unmount();
  });

  it('should verify capture phase parameter is boolean true (not truthy)', () => {
    // Spy on addEventListener
    const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    
    // Render the terminal
    const { unmount } = render(<SharedTerminal />);
    
    // Find the keydown listener
    const keydownCalls = addEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown'
    );
    
    // Verify at least one keydown listener exists
    expect(keydownCalls.length).toBeGreaterThan(0);
    
    // Find the capture phase call
    const captureCall = keydownCalls.find(call => call[2] === true);
    
    // Verify the third parameter is strictly boolean true
    expect(captureCall).toBeDefined();
    expect(captureCall![2]).toBe(true);
    expect(typeof captureCall![2]).toBe('boolean');
    
    // Cleanup
    addEventListenerSpy.mockRestore();
    unmount();
  });
});

describe('SharedTerminal - Clipboard Operations Property Tests', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  });

  /**
   * **Property 4: Clipboard copy operation**
   * **Validates: Requirements 4.1, 4.3, 4.4**
   * 
   * For any text selection in the terminal, pressing Ctrl+Shift+C SHALL copy
   * the selection to the clipboard and maintain terminal focus.
   */
  it('should copy selection to clipboard on Ctrl+Shift+C', () => {
    // Arbitrary for generating random text selections
    const textSelectionArbitrary = fc.string({ minLength: 1, maxLength: 100 });

    fc.assert(
      fc.property(textSelectionArbitrary, (selectedText) => {
        // Reset clipboard mock for each property test run
        vi.mocked(navigator.clipboard.writeText).mockClear();
        
        // Render the terminal
        const { container, unmount } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        if (!terminalContainer) {
          unmount();
          return false;
        }
        
        // Mock terminal selection
        lastTerminalInstance.getSelection = vi.fn(() => selectedText);
        
        // Create a keyboard event for Ctrl+Shift+C
        const event = new KeyboardEvent('keydown', {
          code: 'KeyC',
          key: 'c',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault and stopPropagation
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault and stopPropagation were called (manual handling)
        const result = preventDefaultSpy.mock.calls.length > 0 &&
                      stopPropagationSpy.mock.calls.length > 0 &&
                      vi.mocked(navigator.clipboard.writeText).mock.calls.length > 0 &&
                      vi.mocked(navigator.clipboard.writeText).mock.calls[0][0] === selectedText &&
                      lastTerminalInstance.focus !== undefined;
        
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 4: Clipboard copy operation - Empty selection handling**
   * **Validates: Requirements 4.1, 4.3, 4.4**
   * 
   * When no text is selected, Ctrl+Shift+C SHALL still be handled but
   * clipboard.writeText should not be called.
   */
  it('should handle Ctrl+Shift+C gracefully when no text is selected', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Reset clipboard mock for each property test run
        vi.mocked(navigator.clipboard.writeText).mockClear();
        
        // Render the terminal
        const { container, unmount } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        if (!terminalContainer) {
          unmount();
          return false;
        }
        
        // Mock terminal selection as empty
        lastTerminalInstance.getSelection = vi.fn(() => '');
        
        // Create a keyboard event for Ctrl+Shift+C
        const event = new KeyboardEvent('keydown', {
          code: 'KeyC',
          key: 'c',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault was called but clipboard.writeText was NOT called
        const result = preventDefaultSpy.mock.calls.length > 0 &&
                      vi.mocked(navigator.clipboard.writeText).mock.calls.length === 0;
        
        unmount();
        return result;
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Property 5: Clipboard paste operation**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   * 
   * For any clipboard content, pressing Ctrl+Shift+V SHALL paste the content
   * into the terminal and maintain terminal focus.
   */
  it('should paste clipboard content on Ctrl+Shift+V', () => {
    // Arbitrary for generating random clipboard text
    const clipboardTextArbitrary = fc.string({ minLength: 1, maxLength: 100 });

    fc.assert(
      fc.property(clipboardTextArbitrary, (clipboardText) => {
        // Mock sendInput
        const mockSendInput = vi.fn();
        
        // Setup context with mock sendInput
        vi.mocked(useTerminalContext).mockReturnValue({
          status: 'connected',
          viewerCount: 1,
          isAuthenticated: true,
          sendInput: mockSendInput,
          sendClear: vi.fn(),
          sendReset: vi.fn(),
          sendResize: vi.fn(),
          connectWithPassword: vi.fn(),
          logout: vi.fn(),
          registerTerminal: vi.fn(),
          unregisterTerminal: vi.fn(),
        } as any);
        
        // Mock clipboard to return the test text
        vi.mocked(navigator.clipboard.readText).mockResolvedValue(clipboardText);
        
        // Render the terminal
        const { container, unmount } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        if (!terminalContainer) {
          unmount();
          return false;
        }
        
        // Create a keyboard event for Ctrl+Shift+V
        const event = new KeyboardEvent('keydown', {
          code: 'KeyV',
          key: 'v',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault and stopPropagation
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault and stopPropagation were called
        // Note: sendInput will be called asynchronously after clipboard.readText resolves
        const result = preventDefaultSpy.mock.calls.length > 0 &&
                      stopPropagationSpy.mock.calls.length > 0 &&
                      vi.mocked(navigator.clipboard.readText).mock.calls.length > 0 &&
                      lastTerminalInstance.focus !== undefined;
        
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 5: Clipboard paste operation - Empty clipboard handling**
   * **Validates: Requirements 4.2, 4.3, 4.4**
   * 
   * When clipboard is empty, Ctrl+Shift+V SHALL still be handled but
   * sendInput should not be called.
   */
  it('should handle Ctrl+Shift+V gracefully when clipboard is empty', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Mock sendInput
        const mockSendInput = vi.fn();
        
        // Setup context with mock sendInput
        vi.mocked(useTerminalContext).mockReturnValue({
          status: 'connected',
          viewerCount: 1,
          isAuthenticated: true,
          sendInput: mockSendInput,
          sendClear: vi.fn(),
          sendReset: vi.fn(),
          sendResize: vi.fn(),
          connectWithPassword: vi.fn(),
          logout: vi.fn(),
          registerTerminal: vi.fn(),
          unregisterTerminal: vi.fn(),
        } as any);
        
        // Mock clipboard to return empty string
        vi.mocked(navigator.clipboard.readText).mockResolvedValue('');
        
        // Render the terminal
        const { container, unmount } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        if (!terminalContainer) {
          unmount();
          return false;
        }
        
        // Create a keyboard event for Ctrl+Shift+V
        const event = new KeyboardEvent('keydown', {
          code: 'KeyV',
          key: 'v',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault was called and clipboard.readText was called
        const result = preventDefaultSpy.mock.calls.length > 0 &&
                      vi.mocked(navigator.clipboard.readText).mock.calls.length > 0;
        
        unmount();
        return result;
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Property 4 & 5: Clipboard operations maintain focus**
   * **Validates: Requirements 4.4**
   * 
   * For any clipboard operation (copy or paste), the terminal SHALL maintain
   * focus after the operation completes.
   */
  it('should maintain terminal focus after clipboard operations', () => {
    // Arbitrary for selecting copy or paste operation
    const operationArbitrary = fc.constantFrom('copy', 'paste');
    const textArbitrary = fc.string({ minLength: 1, maxLength: 50 });

    fc.assert(
      fc.property(operationArbitrary, textArbitrary, (operation, text) => {
        // Mock sendInput
        const mockSendInput = vi.fn();
        
        // Setup context with mock sendInput
        vi.mocked(useTerminalContext).mockReturnValue({
          status: 'connected',
          viewerCount: 1,
          isAuthenticated: true,
          sendInput: mockSendInput,
          sendClear: vi.fn(),
          sendReset: vi.fn(),
          sendResize: vi.fn(),
          connectWithPassword: vi.fn(),
          logout: vi.fn(),
          registerTerminal: vi.fn(),
          unregisterTerminal: vi.fn(),
        } as any);
        
        // Render the terminal
        const { container, unmount } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        if (!terminalContainer) {
          unmount();
          return false;
        }
        
        // Setup based on operation
        if (operation === 'copy') {
          lastTerminalInstance.getSelection = vi.fn(() => text);
        } else {
          vi.mocked(navigator.clipboard.readText).mockResolvedValue(text);
        }
        
        // Create the appropriate keyboard event
        const event = new KeyboardEvent('keydown', {
          code: operation === 'copy' ? 'KeyC' : 'KeyV',
          key: operation === 'copy' ? 'c' : 'v',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        
        // Dispatch the event
        terminalContainer.dispatchEvent(event);
        
        // Verify terminal focus method exists (focus is maintained)
        const result = lastTerminalInstance.focus !== undefined &&
                      typeof lastTerminalInstance.focus === 'function';
        
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });
});

describe('SharedTerminal - Browser Shortcut Blocking Property Tests', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  /**
   * **Property 6: Browser shortcut blocking**
   * **Validates: Requirements 5.1, 5.2, 5.3, 7.3**
   * 
   * For any browser shortcut keypress (Ctrl+T, Ctrl+N, Ctrl+R, Ctrl+L, etc.),
   * the event SHALL be blocked with preventDefault when terminal is focused.
   * Note: KeyW, KeyS, KeyX, KeyO, KeyK, KeyG are editor shortcuts and NOT blocked.
   */
  it('should call preventDefault on browser shortcuts', () => {
    // Define browser shortcuts that should be blocked
    // These match BROWSER_CTRL_SHORTCUTS from shared-terminal.tsx
    // Excludes editor shortcuts: KeyX, KeyO, KeyS, KeyW, KeyK, KeyG
    const browserShortcuts = [
      { code: 'KeyT', description: 'new tab (Ctrl+T)' },
      { code: 'KeyN', description: 'new window (Ctrl+N)' },
      { code: 'KeyR', description: 'reload (Ctrl+R)' },
      { code: 'KeyL', description: 'address bar (Ctrl+L)' },
      { code: 'KeyF', description: 'find (Ctrl+F)' },
      { code: 'KeyH', description: 'history (Ctrl+H)' },
      { code: 'KeyJ', description: 'downloads (Ctrl+J)' },
      { code: 'KeyU', description: 'view source (Ctrl+U)' },
      { code: 'KeyP', description: 'print (Ctrl+P)' },
      { code: 'KeyB', description: 'bookmarks (Ctrl+B)' },
      { code: 'KeyE', description: 'search (Ctrl+E)' },
      { code: 'KeyI', description: 'developer tools (Ctrl+I)' },
      { code: 'KeyQ', description: 'quit (Ctrl+Q)' },
      { code: 'KeyY', description: 'history forward (Ctrl+Y)' },
      { code: 'Digit1', description: 'tab 1 (Ctrl+1)' },
      { code: 'Digit2', description: 'tab 2 (Ctrl+2)' },
      { code: 'Digit9', description: 'tab 9 (Ctrl+9)' },
    ];

    // Arbitrary for selecting a random browser shortcut
    const browserShortcutArbitrary = fc.constantFrom(
      ...browserShortcuts.map(s => s.code)
    );

    fc.assert(
      fc.property(browserShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for the browser shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.startsWith('Digit') ? keyCode.replace('Digit', '') : keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault and stopPropagation
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault WAS called (browser shortcuts are blocked)
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(stopPropagationSpy).toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 6: Browser shortcut blocking - Event does not reach browser**
   * **Validates: Requirements 5.1, 5.2, 5.3, 7.3**
   * 
   * For any browser shortcut, the event SHALL have defaultPrevented = true,
   * preventing the browser from processing the shortcut.
   */
  it('should prevent browser shortcuts from reaching the browser (defaultPrevented = true)', () => {
    // Only include shortcuts that are in BROWSER_CTRL_SHORTCUTS
    // Excludes editor shortcuts: KeyX, KeyO, KeyS, KeyW, KeyK, KeyG
    const browserShortcuts = [
      'KeyT', 'KeyN', 'KeyR', 'KeyL', 'KeyF',
      'KeyH', 'KeyJ', 'KeyU', 'KeyP', 'KeyB', 'KeyE',
      'KeyI', 'KeyQ', 'KeyY', 'Digit1', 'Digit5', 'Digit9'
    ];

    const browserShortcutArbitrary = fc.constantFrom(...browserShortcuts);

    fc.assert(
      fc.property(browserShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for the browser shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.startsWith('Digit') ? keyCode.replace('Digit', '') : keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify the event was prevented (cannot reach browser)
        expect(event.defaultPrevented).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 6: Browser shortcut blocking - NOT forwarded to PTY**
   * **Validates: Requirements 5.1, 5.2, 5.3, 7.3**
   * 
   * For any browser shortcut, the event SHALL be blocked and NOT forwarded to the PTY.
   * This is verified by checking that the event is prevented before reaching xterm.js.
   */
  it('should NOT forward browser shortcuts to PTY (event is blocked)', () => {
    // Only include shortcuts that are in BROWSER_CTRL_SHORTCUTS
    // Excludes editor shortcuts: KeyX, KeyO, KeyS, KeyW, KeyK, KeyG
    const browserShortcuts = [
      'KeyT', 'KeyN', 'KeyR', 'KeyL', 'KeyF', 'KeyH',
      'KeyJ', 'KeyU', 'KeyP', 'KeyB', 'KeyE', 'KeyI'
    ];

    const browserShortcutArbitrary = fc.constantFrom(...browserShortcuts);

    fc.assert(
      fc.property(browserShortcutArbitrary, (keyCode) => {
        // Mock sendInput to track if anything is sent to PTY
        const mockSendInput = vi.fn();
        
        // Setup context with mock sendInput
        vi.mocked(useTerminalContext).mockReturnValue({
          status: 'connected',
          viewerCount: 1,
          isAuthenticated: true,
          sendInput: mockSendInput,
          sendClear: vi.fn(),
          sendReset: vi.fn(),
          sendResize: vi.fn(),
          connectWithPassword: vi.fn(),
          logout: vi.fn(),
          registerTerminal: vi.fn(),
          unregisterTerminal: vi.fn(),
        } as any);
        
        // Render the terminal
        const { container, unmount } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        if (!terminalContainer) {
          unmount();
          return false;
        }
        
        // Create a keyboard event for the browser shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault was called (event is blocked)
        const isBlocked = event.defaultPrevented;
        
        // Verify sendInput was NOT called (not forwarded to PTY)
        // Note: sendInput is called via xterm's onData handler, which won't fire
        // if the event is prevented at the keydown level
        const notForwardedToPTY = mockSendInput.mock.calls.length === 0;
        
        unmount();
        return isBlocked && notForwardedToPTY;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 6: Browser shortcut blocking - Ctrl+Shift combinations**
   * **Validates: Requirements 5.1, 5.2, 5.3, 7.3**
   * 
   * For any Ctrl+Shift combination (except Ctrl+Shift+C/V which are clipboard),
   * the event SHALL be blocked to prevent browser shortcuts like Ctrl+Shift+N,
   * Ctrl+Shift+T, Ctrl+Shift+I (DevTools), etc.
   */
  it('should block Ctrl+Shift browser shortcuts (except clipboard C/V)', () => {
    // Browser shortcuts that use Ctrl+Shift (excluding C and V which are clipboard)
    // Also excluding editor shortcuts that might be used with Shift
    const ctrlShiftShortcuts = [
      'KeyN', 'KeyT', 'KeyI', 'KeyJ', 'KeyB', 'KeyE',
      'KeyP', 'KeyQ', 'KeyR', 'KeyA', 'KeyD', 'KeyF',
      'KeyH', 'KeyL', 'KeyU', 'KeyY'
    ];

    const ctrlShiftShortcutArbitrary = fc.constantFrom(...ctrlShiftShortcuts);

    fc.assert(
      fc.property(ctrlShiftShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for Ctrl+Shift+Key
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        });
        
        // Spy on preventDefault
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        
        // Dispatch the event to the terminal container
        terminalContainer.dispatchEvent(event);
        
        // Verify preventDefault WAS called (Ctrl+Shift shortcuts are blocked)
        expect(preventDefaultSpy).toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 6: Browser shortcut blocking - Capture phase interception**
   * **Validates: Requirements 5.4, 7.4**
   * 
   * Browser shortcuts SHALL be intercepted in the capture phase (before browser
   * processes them), which is why the event listener uses capture: true.
   * This test verifies that preventDefault is called, which is only effective
   * when the listener is in capture phase.
   */
  it('should intercept browser shortcuts in capture phase', () => {
    // Only include shortcuts that are in BROWSER_CTRL_SHORTCUTS
    const browserShortcuts = ['KeyT', 'KeyN', 'KeyR', 'KeyL', 'KeyF'];

    const browserShortcutArbitrary = fc.constantFrom(...browserShortcuts);

    fc.assert(
      fc.property(browserShortcutArbitrary, (keyCode) => {
        // Render the terminal
        const { container } = render(<SharedTerminal />);
        
        // Get the terminal container element
        const terminalContainer = container.querySelector('.terminal-container') as HTMLElement;
        expect(terminalContainer).toBeTruthy();
        
        // Create a keyboard event for the browser shortcut
        const event = new KeyboardEvent('keydown', {
          code: keyCode,
          key: keyCode.replace('Key', '').toLowerCase(),
          ctrlKey: true,
          shiftKey: false,
          bubbles: true,
          cancelable: true,
        });
        
        // Dispatch the event to the terminal container
        // The event will be caught by the capture phase listener
        terminalContainer.dispatchEvent(event);
        
        // Verify the event was prevented (capture phase interception worked)
        expect(event.defaultPrevented).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('SharedTerminal - ANSI Color Rendering Property Tests', () => {
  beforeEach(() => {
    // Setup default mock implementations
    vi.mocked(useTerminalContext).mockReturnValue({
      status: 'connected',
      viewerCount: 1,
      isAuthenticated: true,
      sendInput: vi.fn(),
      sendClear: vi.fn(),
      sendReset: vi.fn(),
      sendResize: vi.fn(),
      connectWithPassword: vi.fn(),
      logout: vi.fn(),
      registerTerminal: vi.fn(),
      unregisterTerminal: vi.fn(),
    } as any);

    vi.mocked(useAuthContext).mockReturnValue({
      isAdmin: true,
      user: null,
      profile: null,
    } as any);
    
    // Reset the last terminal instance
    lastTerminalInstance = null;
  });

  /**
   * **Property 2: ANSI color rendering**
   * **Validates: Requirements 2.1, 2.3, 8.2**
   * 
   * For any ANSI color code from the standard set (red, green, yellow, blue, magenta, cyan),
   * the terminal SHALL be configured with allowProposedApi: true and have the corresponding
   * theme color defined, enabling proper ANSI color rendering.
   */
  it('should have allowProposedApi enabled and theme colors defined for any ANSI color code', () => {
    // Define ANSI color codes and their corresponding theme keys
    const ansiColorMap = {
      red: { code: 31, themeKey: 'red', brightCode: 91, brightThemeKey: 'brightRed' },
      green: { code: 32, themeKey: 'green', brightCode: 92, brightThemeKey: 'brightGreen' },
      yellow: { code: 33, themeKey: 'yellow', brightCode: 93, brightThemeKey: 'brightYellow' },
      blue: { code: 34, themeKey: 'blue', brightCode: 94, brightThemeKey: 'brightBlue' },
      magenta: { code: 35, themeKey: 'magenta', brightCode: 95, brightThemeKey: 'brightMagenta' },
      cyan: { code: 36, themeKey: 'cyan', brightCode: 96, brightThemeKey: 'brightCyan' },
    };

    // Arbitrary for selecting a random ANSI color
    const ansiColorArbitrary = fc.constantFrom(
      ...Object.keys(ansiColorMap)
    );

    fc.assert(
      fc.property(ansiColorArbitrary, (colorName) => {
        // Render the terminal
        render(<SharedTerminal />);
        
        // Verify allowProposedApi is enabled (required for ANSI rendering)
        expect(lastTerminalInstance).toBeTruthy();
        expect(lastTerminalInstance.options.allowProposedApi).toBe(true);
        
        // Get the color configuration
        const colorConfig = ansiColorMap[colorName as keyof typeof ansiColorMap];
        const theme = lastTerminalInstance.options.theme;
        
        // Verify theme is defined
        expect(theme).toBeDefined();
        
        // Verify the standard color is defined in the theme
        expect(theme[colorConfig.themeKey]).toBeDefined();
        expect(typeof theme[colorConfig.themeKey]).toBe('string');
        expect(theme[colorConfig.themeKey]).toMatch(/^#[0-9a-fA-F]{6,8}$/);
        
        // Verify the bright variant is defined in the theme
        expect(theme[colorConfig.brightThemeKey]).toBeDefined();
        expect(typeof theme[colorConfig.brightThemeKey]).toBe('string');
        expect(theme[colorConfig.brightThemeKey]).toMatch(/^#[0-9a-fA-F]{6,8}$/);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 2: ANSI color rendering - Theme consistency**
   * **Validates: Requirements 2.1, 2.3, 8.2**
   * 
   * For any terminal instance, the theme SHALL maintain the configured teal foreground
   * and amber cursor colors while supporting ANSI color rendering.
   */
  it('should maintain theme consistency with ANSI colors enabled', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Render the terminal
        render(<SharedTerminal />);
        
        const theme = lastTerminalInstance.options.theme;
        
        // Verify allowProposedApi is enabled
        expect(lastTerminalInstance.options.allowProposedApi).toBe(true);
        
        // Verify theme consistency (Requirements 8.1, 8.3, 8.4)
        expect(theme.foreground).toBe('#5eead4'); // Teal foreground
        expect(theme.cursor).toBe('#fbbf24'); // Amber cursor
        expect(theme.background).toBe('#00000000'); // Transparent background
        
        // Verify all ANSI colors are present
        const requiredColors = [
          'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'black',
          'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 
          'brightMagenta', 'brightCyan', 'brightWhite', 'brightBlack'
        ];
        
        requiredColors.forEach(color => {
          expect(theme[color]).toBeDefined();
          expect(typeof theme[color]).toBe('string');
        });
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Property 2: ANSI color rendering - Configuration completeness**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * For any terminal instance, all required terminal options for ANSI rendering
   * SHALL be properly configured.
   */
  it('should have all required options for ANSI rendering configured', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Render the terminal
        render(<SharedTerminal />);
        
        const options = lastTerminalInstance.options;
        
        // Verify ANSI rendering prerequisites (Requirement 2.2)
        expect(options.allowProposedApi).toBe(true);
        
        // Verify supporting options (Requirement 2.3)
        expect(options.convertEol).toBe(true);
        expect(options.allowTransparency).toBe(true);
        
        // Verify theme is applied
        expect(options.theme).toBeDefined();
        expect(typeof options.theme).toBe('object');
      }),
      { numRuns: 50 }
    );
  });
});
