import React from "react";
import { Spinner } from "@/components/ui/spinner";

const GlobalLoadingPage = () => {
  return (
    <div className="flex h-[80vh] w-screen items-center justify-center gap-3">
      <Spinner size="large" />
    </div>
  );
};

export default GlobalLoadingPage;
