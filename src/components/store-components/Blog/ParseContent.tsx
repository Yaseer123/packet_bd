"use client";

import React from "react";
import DOMPurify from "dompurify";
import parse, { type HTMLReactParserOptions, Element } from "html-react-parser";

interface ParseContentProps {
  content: string | null;
}

const ParseContent: React.FC<ParseContentProps> = ({ content }) => {
  if (!content) return null;

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (domNode instanceof Element && domNode.name === "iframe") {
        const { src, width, height, allow, allowfullscreen } = domNode.attribs;

        return (
          <div className="video-container relative my-4 w-full pt-[56.25%]">
            <iframe
              src={src}
              width={width ?? "100%"}
              height={height ?? "100%"}
              allow={
                allow ??
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              }
              allowFullScreen={allowfullscreen !== undefined}
              className="absolute left-0 top-0 h-full w-full rounded-lg"
            />
          </div>
        );
      }
    },
  };

  const sanitizedContent = DOMPurify.sanitize(content, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
  });

  return (
    <div className="prose max-w-none">{parse(sanitizedContent, options)}</div>
  );
};

export default ParseContent;
