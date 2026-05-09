import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Code, CodeHeader, CodeBlock } from "@/components/animate-ui/components/animate/code";
import { FileCode } from "lucide-react";

// React component for rendering the code block
function CodeBlockComponent({ node, updateAttributes }: any) {
  const { language, code } = node.attrs;

  return (
    <NodeViewWrapper className="my-4">
      <Code code={code || ""}>
        <CodeHeader icon={FileCode} copyButton>
          {language || "plaintext"}
        </CodeHeader>
        <CodeBlock 
          lang={language || "plaintext"} 
          writing={true}
          cursor={true}
        />
      </Code>
    </NodeViewWrapper>
  );
}

// TipTap extension for animated code blocks
export const AnimatedCodeBlock = Node.create({
  name: "animatedCodeBlock",
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  defining: true,

  addAttributes() {
    return {
      language: {
        default: "plaintext",
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => ({
          "data-language": attributes.language,
        }),
      },
      code: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-code") || element.textContent,
        renderHTML: (attributes) => ({
          "data-code": attributes.code,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre[data-animated-code]",
        preserveWhitespace: "full",
      },
      {
        tag: "pre code",
        preserveWhitespace: "full",
        getAttrs: (node) => {
          const codeElement = node as HTMLElement;
          const preElement = codeElement.parentElement;
          const className = codeElement.className || "";
          const languageMatch = className.match(/language-(\w+)/);
          
          return {
            language: languageMatch ? languageMatch[1] : "plaintext",
            code: codeElement.textContent || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "pre",
      mergeAttributes(HTMLAttributes, {
        "data-animated-code": "true",
        "data-language": node.attrs.language,
        "data-code": node.attrs.code,
      }),
      ["code", { class: `language-${node.attrs.language}` }, node.attrs.code || ""],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph", attributes);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        const isAtStart = $anchor.pos === 1;

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false;
        }

        if (isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes();
        }

        return false;
      },
    };
  },
});
