import { BubbleMenu, type ChainedCommands, type Editor } from "@tiptap/react";
import { type ChangeEventHandler, type FC, useEffect, useState } from "react";
import {
  BiAlignLeft,
  BiAlignMiddle,
  BiAlignRight,
  BiBold,
  BiCodeAlt,
  BiCodeCurly,
  BiImageAlt,
  BiItalic,
  BiListOl,
  BiListUl,
  BiStrikethrough,
  BiUnderline,
  BiVideo,
} from "react-icons/bi";
import LinkEditForm from "./LinkEditForm";
import LinkForm from "./LinkForm";
import ToolButton from "./ToolButton";
import YoutubeDialog from "./YoutubeDialog";

interface Props {
  editor: Editor | null;
  onImageSelection: () => void;
  onYoutubeInsert: (url: string) => void;
  onToggleSource: () => void;
}

const tools = [
  {
    task: "bold",
    icon: <BiBold size={20} />,
  },
  {
    task: "italic",
    icon: <BiItalic size={20} />,
  },
  {
    task: "underline",
    icon: <BiUnderline size={20} />,
  },
  {
    task: "strike",
    icon: <BiStrikethrough size={20} />,
  },
  {
    task: "code",
    icon: <BiCodeAlt size={20} />,
  },
  {
    task: "codeBlock",
    icon: <BiCodeCurly size={20} />,
  },
  {
    task: "left",
    icon: <BiAlignLeft size={20} />,
  },
  {
    task: "center",
    icon: <BiAlignMiddle size={20} />,
  },
  {
    task: "right",
    icon: <BiAlignRight size={20} />,
  },
  {
    task: "bulletList",
    icon: <BiListUl size={20} />,
  },
  {
    task: "orderedList",
    icon: <BiListOl size={20} />,
  },
  {
    task: "image",
    icon: <BiImageAlt size={20} />,
  },
  {
    task: "youtube",
    icon: <BiVideo size={20} />,
  },
] as const;

const headingOptions = [
  { task: "p", value: "Paragraph" },
  { task: "h1", value: "Heading 1" },
  { task: "h2", value: "Heading 2" },
  { task: "h3", value: "Heading 3" },
] as const;

const fontSizeOptions = [
  { task: "12", value: "12pt" },
  { task: "14", value: "14pt" },
  { task: "16", value: "16pt" },
  { task: "18", value: "18pt" },
  { task: "20", value: "20pt" },
  { task: "24", value: "24pt" },
  { task: "28", value: "28pt" },
  { task: "32", value: "32pt" },
  { task: "36", value: "36pt" },
  { task: "40", value: "40pt" },
] as const;

const chainMethods = (
  editor: Editor | null,
  command: (chain: ChainedCommands) => ChainedCommands,
) => {
  if (!editor) return;

  command(editor.chain().focus()).run();
};

type TaskType = (typeof tools)[number]["task"];
type HeadingType = (typeof headingOptions)[number]["task"];
type FontSizeType = (typeof fontSizeOptions)[number]["task"];
const Tools: FC<Props> = ({
  editor,
  onImageSelection,
  onYoutubeInsert,
  onToggleSource,
}) => {
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);

  // Add keyboard shortcut to delete selected YouTube videos
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if a YouTube node is selected and Delete/Backspace is pressed
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        editor.isActive("youtube")
      ) {
        editor.commands.deleteSelection();
        event.preventDefault();
      }
    };

    // Add the event listener to the editor's DOM element
    const editorElement = editor.view.dom;
    editorElement.addEventListener("keydown", handleKeyDown);

    return () => {
      editorElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  const handleOnClick = (task: TaskType) => {
    switch (task) {
      case "bold":
        return chainMethods(editor, (chain) => chain.toggleBold());
      case "italic":
        return chainMethods(editor, (chain) => chain.toggleItalic());
      case "underline":
        return chainMethods(editor, (chain) => chain.toggleUnderline());
      case "strike":
        return chainMethods(editor, (chain) => chain.toggleStrike());
      case "code":
        return chainMethods(editor, (chain) => chain.toggleCode());
      case "codeBlock":
        return chainMethods(editor, (chain) => chain.toggleCodeBlock());
      case "orderedList":
        return chainMethods(editor, (chain) => chain.toggleOrderedList());
      case "bulletList":
        return chainMethods(editor, (chain) => chain.toggleBulletList());
      case "left":
        return chainMethods(editor, (chain) => chain.setTextAlign("left"));
      case "center":
        return chainMethods(editor, (chain) => chain.setTextAlign("center"));
      case "right":
        return chainMethods(editor, (chain) => chain.setTextAlign("right"));
      case "image":
        return onImageSelection();
      case "youtube":
        return setShowYoutubeDialog(true);
    }
  };

  const handleLinkSubmission = (href: string) => {
    // empty
    if (href === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();

      return;
    }

    // update link
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const handleHeadingSelection: ChangeEventHandler<HTMLSelectElement> = ({
    target,
  }) => {
    const { value } = target as { value: HeadingType };

    switch (value) {
      case "p":
        return chainMethods(editor, (chain) => chain.setParagraph());
      case "h1":
        return chainMethods(editor, (chain) =>
          chain.toggleHeading({ level: 1 }),
        );
      case "h2":
        return chainMethods(editor, (chain) =>
          chain.toggleHeading({ level: 2 }),
        );
      case "h3":
        return chainMethods(editor, (chain) =>
          chain.toggleHeading({ level: 3 }),
        );
    }
  };

  const getInitialLink = (): string | undefined => {
    const attributes = editor?.getAttributes("link") as
      | { href: string }
      | undefined;

    if (attributes) return attributes.href;
    return undefined;
  };

  const getSelectedHeading = (): HeadingType => {
    let result: HeadingType = "p";

    if (editor?.isActive("heading", { level: 1 })) result = "h1";
    if (editor?.isActive("heading", { level: 2 })) result = "h2";
    if (editor?.isActive("heading", { level: 3 })) result = "h3";

    return result;
  };

  const getSelectedFontSize = (): FontSizeType => {
    const fontSize =
      (editor?.getAttributes("textStyle") as { fontSize?: string })?.fontSize ??
      "14pt"; // Default to 14pt
    const numericSize = fontSize.replace("pt", "");

    const validSize = fontSizeOptions.find(
      (option) => option.task === numericSize,
    );
    return validSize ? validSize.task : "14"; // Default to 14 if invalid
  };

  const handleFontSizeSelection: ChangeEventHandler<HTMLSelectElement> = ({
    target,
  }) => {
    const { value } = target as { value: FontSizeType };
    chainMethods(editor, (chain) => chain.setFontSize(`${value}pt`));
  };

  return (
    <div
      className="rich-editor-toolbar flex w-full flex-wrap items-start gap-1 space-x-1 px-2 py-2 md:flex-nowrap md:overflow-x-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <select
        value={getSelectedHeading()}
        className="p-2"
        onChange={handleHeadingSelection}
      >
        {headingOptions.map((item) => {
          return (
            <option key={item.task} value={item.task}>
              {item.value}
            </option>
          );
        })}
      </select>

      <select
        value={getSelectedFontSize()}
        className="p-2"
        onChange={handleFontSizeSelection}
      >
        {fontSizeOptions.map((item) => {
          return (
            <option key={item.task} value={item.task}>
              {item.value}
            </option>
          );
        })}
      </select>

      <LinkForm onSubmit={handleLinkSubmission} />

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => editor.isActive("link")}
      >
        <LinkEditForm
          initialState={getInitialLink()}
          onSubmit={handleLinkSubmission}
        />
      </BubbleMenu>

      {tools.map(({ icon, task }) => {
        return (
          <ToolButton
            key={task}
            onClick={() => handleOnClick(task)}
            active={
              editor?.isActive(task) ?? editor?.isActive({ textAlign: task })
            }
          >
            {icon}
          </ToolButton>
        );
      })}

      <YoutubeDialog
        isOpen={showYoutubeDialog}
        onClose={() => setShowYoutubeDialog(false)}
        onSubmit={onYoutubeInsert}
      />
      <ToolButton onClick={onToggleSource}>
        <span className="flex items-center gap-2">
          <BiCodeAlt size={20} /> Source
        </span>
      </ToolButton>
    </div>
  );
};

export default Tools;
