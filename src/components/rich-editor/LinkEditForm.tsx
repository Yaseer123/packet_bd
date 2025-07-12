"use client";

import { type FC, useEffect, useState } from "react";
import { BiUnlink } from "react-icons/bi";

interface Props {
  initialState?: string;
  onSubmit: (link: string) => void;
}

const LinkEditForm: FC<Props> = ({ initialState, onSubmit }) => {
  const [link, setLink] = useState("");

  useEffect(() => {
    if (initialState) setLink(initialState);
  }, [initialState]);

  return (
    <div>
      <div className="absolute top-10 z-50 flex items-center rounded bg-white p-2 shadow-sm outline-none ring-1 ring-black">
        <input
          value={link}
          onChange={({ target }) => setLink(target.value)}
          type="text"
          className="outline-none"
          placeholder="https://url.com"
        />
        <button
          onMouseDown={() => {
            onSubmit(link);
          }}
          className="flex aspect-square w-8 items-center justify-center bg-black text-white hover:bg-black/75"
        >
          ok
        </button>
        <button
          onMouseDown={() => {
            onSubmit("");
          }}
          className="flex aspect-square w-8 items-center justify-center bg-red-400 text-white"
        >
          <BiUnlink />
        </button>
      </div>
    </div>
  );
};

export default LinkEditForm;
