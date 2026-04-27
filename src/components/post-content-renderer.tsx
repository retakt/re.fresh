import { useEffect, useRef } from "react";
import { Code, CodeHeader, CodeBlock } from "@/components/animate-ui/components/animate/code";
import { FileCode } from "lucide-react";
import { createRoot } from "react-dom/client";

interface PostContentRendererProps {
  html: string;
  className?: string;
}

export function PostContentRenderer({ html, className = "" }: PostContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a wrapper to preserve structure
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    // Find all code blocks with data-animated-code attribute
    const codeBlocks = wrapper.querySelectorAll("pre[data-animated-code]");

    codeBlocks.forEach((pre) => {
      const language = pre.getAttribute("data-language") || "plaintext";
      const codeElement = pre.querySelector("code");
      const code = codeElement?.textContent || "";

      // Create a container for the React component
      const reactContainer = document.createElement("div");
      reactContainer.className = "my-4";
      
      // Replace the pre element
      pre.replaceWith(reactContainer);

      // Render the React component
      const root = createRoot(reactContainer);
      root.render(
        <Code code={code}>
          <CodeHeader icon={FileCode} copyButton>
            {language}
          </CodeHeader>
          <CodeBlock 
            lang={language}
            writing={true}
            cursor={true}
          />
        </Code>
      );
    });

    // Clear and set the content
    containerRef.current.innerHTML = "";
    while (wrapper.firstChild) {
      containerRef.current.appendChild(wrapper.firstChild);
    }
  }, [html]);

  return <div ref={containerRef} className={className} />;
}
