'use client';

import * as React from 'react';

import {
  useIsInView,
  type UseIsInViewOptions,
} from '@/hooks/use-is-in-view';

type CodeBlockProps = React.ComponentProps<'div'> & {
  code: string;
  lang: string;
  theme?: 'light' | 'dark';
  themes?: { light: string; dark: string };
  writing?: boolean;
  duration?: number;
  delay?: number;
  onDone?: () => void;
  onWrite?: (info: { index: number; length: number; done: boolean }) => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
} & UseIsInViewOptions;

function CodeBlock({
  ref,
  code,
  lang,
  theme = 'light',
  themes = {
    light: 'github-light',
    dark: 'github-dark',
  },
  writing = false,
  duration = 5000,
  delay = 0,
  onDone,
  onWrite,
  scrollContainerRef,
  inView = false,
  inViewOnce = true,
  inViewMargin = '0px',
  ...props
}: CodeBlockProps) {
  const { ref: localRef, isInView } = useIsInView(
    ref as React.Ref<HTMLDivElement>,
    {
      inView,
      inViewOnce,
      inViewMargin,
    },
  );

  const [visibleCode, setVisibleCode] = React.useState('');
  const [highlightedCode, setHighlightedCode] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    if (!visibleCode.length || !isInView) return;

    const loadHighlightedCode = async () => {
      try {
        const { codeToHtml } = await import('shiki');

        // Map unsupported languages to similar supported ones
        const languageMap: Record<string, string> = {
          'b': 'c', // B language uses C syntax highlighting
        };
        
        const effectiveLang = languageMap[lang] || lang;

        // Try to highlight with the specified language, fallback to plaintext if it fails
        let highlighted;
        try {
          highlighted = await codeToHtml(visibleCode, {
            lang: effectiveLang,
            themes,
            defaultColor: theme,
          });
        } catch (langError) {
          console.warn(`Language "${lang}" not supported, falling back to plaintext`);
          highlighted = await codeToHtml(visibleCode, {
            lang: 'plaintext',
            themes,
            defaultColor: theme,
          });
        }

        setHighlightedCode(highlighted);
      } catch (e) {
        console.error(`Failed to highlight code:`, e);
        // Last resort: display as plain text without highlighting
        setHighlightedCode(`<pre><code>${visibleCode}</code></pre>`);
      }
    };

    loadHighlightedCode();
  }, [lang, themes, writing, isInView, duration, delay, visibleCode, theme]);

  React.useEffect(() => {
    if (!writing) {
      setVisibleCode(code);
      onDone?.();
      onWrite?.({ index: code.length, length: code.length, done: true });
      return;
    }

    if (!code.length || !isInView) return;

    const characters = Array.from(code);
    let index = 0;
    const totalDuration = duration;
    const interval = totalDuration / characters.length;
    let intervalId: NodeJS.Timeout;
    let loopTimeoutId: NodeJS.Timeout;

    const startAnimation = () => {
      index = 0;
      setVisibleCode('');
      setIsDone(false);

      const timeout = setTimeout(() => {
        intervalId = setInterval(() => {
          if (index < characters.length) {
            setVisibleCode(() => {
              const nextChar = characters.slice(0, index + 1).join('');
              onWrite?.({
                index: index + 1,
                length: characters.length,
                done: false,
              });
              index += 1;
              return nextChar;
            });
            localRef.current?.scrollTo({
              top: localRef.current?.scrollHeight,
              behavior: 'smooth',
            });
          } else {
            clearInterval(intervalId);
            setIsDone(true);
            onDone?.();
            onWrite?.({
              index: characters.length,
              length: characters.length,
              done: true,
            });
            
            // Loop: Reset after a delay and restart
            loopTimeoutId = setTimeout(() => {
              startAnimation();
            }, 2000); // 2 second pause before restarting
          }
        }, interval);
      }, delay);

      return timeout;
    };

    const initialTimeout = startAnimation();

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      clearTimeout(loopTimeoutId);
    };
  }, [code, duration, delay, isInView, writing, onDone, onWrite, localRef]);

  React.useEffect(() => {
    if (!writing || !isInView) return;
    const el =
      scrollContainerRef?.current ??
      (localRef.current?.parentElement as HTMLElement | null) ??
      (localRef.current as unknown as HTMLElement | null);

    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [highlightedCode, writing, isInView, scrollContainerRef, localRef]);

  return (
    <div
      ref={localRef}
      data-slot="code-block"
      data-writing={writing}
      data-done={isDone}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      {...props}
    />
  );
}

export { CodeBlock, type CodeBlockProps };
