import { Node, mergeAttributes } from "@tiptap/core";
import { TextSelection } from "prosemirror-state";

export interface YoutubeOptions {
  addPasteHandler: boolean;
  allowFullscreen: boolean;
  ccLanguage: string;
  width: number;
  height: number;
  HTMLAttributes: Record<string, string | number | boolean | null | undefined>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtube: {
      /**
       * Add a YouTube video
       */
      setYoutubeVideo: (options: { src: string }) => ReturnType;
      /**
       * Remove a YouTube video
       */
      removeYoutubeVideo: () => ReturnType;
    };
  }
}

// Helper function to convert YouTube URL to embed format
function getEmbedUrl(url: string) {
  // Convert YouTube video URLs to embed format
  if (!url) {
    return "";
  }

  // Extract video ID from different YouTube URL formats
  const videoIdRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = videoIdRegex.exec(url);

  if (!match) {
    return url;
  }

  const videoId = match[1];

  return `https://www.youtube.com/embed/${videoId}`;
}

export const Youtube = Node.create<YoutubeOptions>({
  name: "youtube",

  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      ccLanguage: "en",
      width: 640,
      height: 480,
      HTMLAttributes: {
        class: "youtube-video",
      },
    };
  },

  group: "block",

  content: "",

  marks: "",

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => {
          const src = element.getAttribute("src");
          return src;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-youtube-video] iframe",
        getAttrs: (node: { getAttribute: (arg0: string) => string | null }) => {
          if (typeof node === "string" || !(node instanceof HTMLElement)) {
            return {};
          }
          // For iframe elements that are direct children of div[data-youtube-video]
          return { src: node.getAttribute("src") };
        },
      },
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (node: { getAttribute: (arg0: string) => string | null }) => {
          if (typeof node === "string" || !(node instanceof HTMLElement)) {
            return {};
          }
          return { src: node.getAttribute("src") };
        },
      },
      {
        tag: 'iframe[src*="youtu.be"]',
        getAttrs: (node: { getAttribute: (arg0: string) => string | null }) => {
          if (typeof node === "string" || !(node instanceof HTMLElement)) {
            return {};
          }
          return { src: node.getAttribute("src") };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Use the helper function directly instead of as a method
    const embedUrl = getEmbedUrl(
      typeof HTMLAttributes.src === "string" ? HTMLAttributes.src : "",
    );

    HTMLAttributes.src = embedUrl;

    return [
      "div",
      {
        class: "youtube-video-wrapper",
        "data-youtube-video": "",
        "data-type": "youtube-video", // Add a clear data-type marker
      },
      [
        "iframe",
        mergeAttributes(
          {
            width: this.options.width,
            height: this.options.height,
            allowfullscreen: this.options.allowFullscreen,
            class: "youtube-video-iframe",
            frameborder: "0",
          },
          HTMLAttributes,
        ),
      ],
    ];
  },

  addCommands() {
    return {
      setYoutubeVideo:
        (options) =>
        ({ commands, state }) => {
          const { selection } = state;
          const insertPos = selection.$anchor.after(); // Insert one row below the cursor
          return commands.insertContentAt(insertPos, {
            type: this.name,
            attrs: {
              ...options,
              width: this.options.width, // Set initial width
              height: this.options.height, // Set initial height
            },
          });
        },
      // Add a command to delete the YouTube video
      removeYoutubeVideo:
        () =>
        ({ commands, state }) => {
          // Find the YouTube node position
          const { selection } = state;
          const nodePos = selection.$anchor.pos;

          // If we have a node selected and it's YouTube, delete it
          const node = state.doc.nodeAt(nodePos);
          if (node && node.type.name === this.name) {
            return commands.deleteNode(this.name);
          }

          return false;
        },
    };
  },

  // Add node selection support
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("div");
      dom.classList.add("youtube-video-wrapper");
      dom.setAttribute("data-youtube-video", "");

      const iframe = document.createElement("iframe");
      iframe.src = getEmbedUrl(
        typeof node.attrs.src === "string" ? node.attrs.src : "",
      );
      iframe.width = String(this.options.width);
      iframe.height = String(this.options.height);
      iframe.classList.add("youtube-video-iframe");
      iframe.frameBorder = "0";
      iframe.allowFullscreen = this.options.allowFullscreen;

      dom.append(iframe);

      // Add a deletion and edit overlay on selection
      const overlay = document.createElement("div");
      overlay.classList.add("youtube-video-overlay");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.display = "none";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
      overlay.style.zIndex = "10";

      const removeButton = document.createElement("button");
      removeButton.innerHTML = "✖";
      removeButton.title = "Remove video";
      removeButton.style.position = "absolute";
      removeButton.style.top = "10px";
      removeButton.style.right = "10px";
      removeButton.style.backgroundColor = "red";
      removeButton.style.color = "white";
      removeButton.style.border = "none";
      removeButton.style.borderRadius = "50%";
      removeButton.style.width = "30px";
      removeButton.style.height = "30px";
      removeButton.style.cursor = "pointer";
      removeButton.style.display = "flex";
      removeButton.style.alignItems = "center";
      removeButton.style.justifyContent = "center";

      removeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof getPos === "function") {
          editor.commands.deleteNode(this.name);
        }
      });

      // Edit button
      const editButton = document.createElement("button");
      editButton.innerHTML = "✎";
      editButton.title = "Edit video";
      editButton.style.position = "absolute";
      editButton.style.top = "10px";
      editButton.style.right = "50px";
      editButton.style.backgroundColor = "#2563eb";
      editButton.style.color = "white";
      editButton.style.border = "none";
      editButton.style.borderRadius = "50%";
      editButton.style.width = "30px";
      editButton.style.height = "30px";
      editButton.style.cursor = "pointer";
      editButton.style.display = "flex";
      editButton.style.alignItems = "center";
      editButton.style.justifyContent = "center";
      editButton.style.fontWeight = "bold";
      editButton.addEventListener("click", (e) => {
        e.stopPropagation();
        // Dispatch a custom event to the document for React to listen
        const event = new CustomEvent("edit-youtube-video", {
          detail: {
            pos: typeof getPos === "function" ? getPos() : null,
            src: typeof node.attrs?.src === "string" ? node.attrs.src : "",
          },
        });
        document.dispatchEvent(event);
      });

      overlay.appendChild(editButton);
      overlay.appendChild(removeButton);
      dom.appendChild(overlay);

      // Show overlay on click and select the node
      dom.addEventListener("click", () => {
        overlay.style.display = "block";
        // Select the node in the editor
        if (typeof getPos === "function") {
          const { state, view } = editor;
          const selection = TextSelection.create(
            state.doc,
            getPos(),
            getPos() + 1,
          );
          const tr = state.tr.setSelection(selection);
          view.dispatch(tr);
        }
      });

      // Hide overlay when clicking elsewhere
      document.addEventListener("click", (_event: MouseEvent) => {
        if (_event.target && !dom.contains(_event.target as globalThis.Node)) {
          overlay.style.display = "none";
        }
      });

      return {
        dom,
        update: (
          node: { attrs: { src?: string } },
          _decorations: readonly unknown[],
          _innerDecorations: unknown,
        ) => {
          iframe.src = getEmbedUrl(
            typeof node.attrs.src === "string" ? node.attrs.src : "",
          );
          return true;
        },
      };
    };
  },
});
