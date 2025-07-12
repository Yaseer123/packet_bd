import type { FC } from "react";
import { BiCheck, BiSolidTrash } from "react-icons/bi";

interface Props {
  onDeleteClick?: () => void;
  onSelectClick?: () => void;
  children: React.ReactNode;
}

const GalleryImage: FC<Props> = ({
  onDeleteClick,
  onSelectClick,
  children,
}) => {
  return (
    <div className="group relative aspect-square w-full overflow-hidden rounded">
      {children}

      <div className="absolute bottom-0 left-0 right-0 hidden group-hover:flex">
        <button
          onClick={onDeleteClick}
          className="flex flex-1 items-center justify-center bg-red-400 p-2 text-white"
        >
          <BiSolidTrash />
        </button>

        <button
          onClick={onSelectClick}
          className="flex flex-1 items-center justify-center bg-blue-400 p-2 text-white"
        >
          <BiCheck />
        </button>
      </div>
    </div>
  );
};

export default GalleryImage;
