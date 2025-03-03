import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Add custom styles to override KaTeX defaults
const mathStyles = `
  .katex-display {
    margin: 0 !important;
    padding: 0 !important;
    text-align: left !important;
  }
  .katex-display > .katex {
    text-align: left !important;
  }
  .katex {
    text-align: left !important;
  }
`;

// Extend the ReactMarkdown props to accept additional props like components and className
interface MathRenderProps extends Omit<React.ComponentProps<typeof ReactMarkdown>, 'children'> {
  content: string;
  components?: any;
}

export const MathRender: React.FC<MathRenderProps> = ({ content, ...props }) => {
  return (
    <>
      <style>{mathStyles}</style>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        {...props}
      >
        {content}
      </ReactMarkdown>
    </>
  );
};

export default MathRender; 