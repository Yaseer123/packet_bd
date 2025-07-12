"use client";

import { type FC, useState } from "react";
import ToolButton from "./ToolButton";
import { BiLink } from "react-icons/bi";

interface Props {
  onSubmit: (link: string) => void;
}

const LinkForm: FC<Props> = ({ onSubmit }) => {
  const [showForm, setShowForm] = useState(false);
  const [link, setLink] = useState("");

  return (
    <div>
      <ToolButton onClick={() => setShowForm(true)}>
        <BiLink size={20} />
      </ToolButton>
      {showForm && (
        <div className="absolute top-10 z-50 flex items-center rounded bg-white p-2 shadow-sm outline-none ring-1 ring-black">
          <input
            value={link}
            onChange={({ target }) => setLink(target.value)}
            onBlur={() => setShowForm(false)}
            type="text"
            className="outline-none"
            placeholder="https://url.com"
          />
          <button
            onClick={() => {
              setLink("");
              setShowForm(false);
            }}
            onMouseDown={() => {
              onSubmit(link);
            }}
            className="ml-1 bg-white"
          >
            ok
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkForm;
