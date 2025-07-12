import clsx from "clsx";
import type { FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const ToolButton: FC<Props> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-md p-2",
        active ? "bg-black text-white hover:bg-black/75" : "text-black",
      )}
    >
      {children}
    </button>
  );
};

export default ToolButton;
