"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import modals
const ModalCart = dynamic(() => import("./ModalCart"), { ssr: false });
const ModalWishlist = dynamic(() => import("./ModalWishlist"), { ssr: false });
const ModalQuickView = dynamic(() => import("./ModalQuickView"), {
  ssr: false,
});

const ModalWrapper = () => {
  return (
    <>
      <ModalCart />
      <ModalWishlist />
      <ModalQuickView />
    </>
  );
};

export default ModalWrapper;
