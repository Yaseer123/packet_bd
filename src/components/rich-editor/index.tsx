"use client";

import { useImageStore } from "@/context/admin-context/ImageProvider";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { FontSize } from "./extensions/fontSize";
import { Youtube } from "./extensions/youtube";
import ImageGallery from "./ImageGallery";
import Tools from "./Tools";

const extensions = [
  StarterKit,
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: false,
    linkOnPaste: true,
    HTMLAttributes: {
      target: "",
    },
  }),
  Image.configure({
    inline: false,
    HTMLAttributes: {
      class: "w-[80%] mx-auto",
    },
  }),
  TextAlign.configure({
    types: ["paragraph"],
  }),
  Placeholder.configure({
    placeholder: "Write something...",
  }),
  TextStyle,
  FontSize.configure({ defaultSize: "14pt" }), // Set default size here
  Youtube.configure({
    width: 560,
    height: 315,
    HTMLAttributes: {
      class: "w-full aspect-video mx-auto my-4",
    },
  }),
];

export default function RichEditor({
  content,
  imageId,
  handleSubmit,
  pending,
  submitButtonText,
  children,
}: {
  content: string;
  imageId: string;
  handleSubmit: (content: string) => void;
  pending: boolean;
  submitButtonText: string;
  children: React.ReactNode;
}) {
  const [showImageGallery, setShowImageGallery] = useState("");
  const { loadImages } = useImageStore();
  const [sourceMode, setSourceMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState(content);

  useEffect(() => {
    void (async () => {
      try {
        await loadImages(imageId);
      } catch (error) {
        console.error("Failed to load images:", error);
      }
    })();
  }, [loadImages, imageId]);

  // Enhanced editor setup
  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl outline-none",
      },
    },
    content: content,
    onUpdate: ({ editor }) => {
      // Log content for debugging
      console.log("Editor content updated:", editor.getHTML());
      if (!sourceMode) setHtmlSource(editor.getHTML());
    },
  });

  // Toggle between source and rich mode
  const handleToggleSource = () => {
    if (sourceMode && editor) {
      // Switching from source to rich, update editor content
      editor.commands.setContent(htmlSource, false);
    }
    setSourceMode((prev) => !prev);
  };

  const onImageSelect = (image: string) => {
    editor
      ?.chain()
      .focus()
      .setImage({ src: image, alt: "this is an image" })
      .run();
  };

  const onYoutubeVideoAdd = (url: string) => {
    editor
      ?.chain()
      .focus()
      .setYoutubeVideo({
        src: url,
      })
      .run();
  };

  const handleShowImageGallery = (state: string) => {
    setShowImageGallery(state);
  };

  // Enhanced submit handler to ensure YouTube videos are preserved
  const handleFormSubmit = () => {
    if (!editor) return;

    const htmlContent = editor.getHTML();
    console.log("Submitting content:", htmlContent);
    handleSubmit(htmlContent);
  };

  return (
    <>
      <style jsx global>{`
        .youtube-video-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 aspect ratio for videos */
          height: 0;
          margin: 1rem 0;
        }

        .youtube-video-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .ProseMirror-selectednode .youtube-video-wrapper::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          pointer-events: none;
        }
        .rich-editor-toolbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
        }
        .rich-editor-toolbar::-webkit-scrollbar {
          display: none; /* Chrome/Safari/Webkit */
        }
      `}</style>
      <div className="flex flex-col space-y-4">
        {children}
        <div className="flex min-h-[40vh] w-full min-w-0 max-w-full flex-col items-center justify-center space-y-4 rounded-md border p-2 md:min-h-[65vh] md:p-5">
          <div className="sticky top-0 z-30 w-full bg-white">
            <Tools
              editor={editor}
              onImageSelection={() => handleShowImageGallery(imageId)}
              onYoutubeInsert={onYoutubeVideoAdd}
              onToggleSource={handleToggleSource}
            />
          </div>
          <div className="w-full min-w-0 max-w-full flex-1 text-sm">
            {sourceMode ? (
              <div className="flex h-full w-full flex-col">
                <textarea
                  className="h-[40vh] w-full min-w-0 max-w-full rounded border p-2 font-mono text-xs md:h-[60vh]"
                  value={htmlSource}
                  onChange={(e) => setHtmlSource(e.target.value)}
                  style={{ minHeight: 200 }}
                />
                <Button className="mt-2 self-end" onClick={handleToggleSource}>
                  Apply & Return to Editor
                </Button>
              </div>
            ) : (
              <EditorContent
                editor={editor}
                className="h-full w-full min-w-0 max-w-full"
              />
            )}
          </div>
        </div>
        <div className="p-4 text-right">
          <Button onClick={handleFormSubmit} disabled={pending}>
            {pending ? "Submitting..." : submitButtonText}
          </Button>
        </div>
      </div>
      <ImageGallery
        onSelect={onImageSelect}
        visible={showImageGallery}
        onClose={handleShowImageGallery}
        imageId={imageId}
      />
    </>
  );
}
