import "@/styles/admin-styles.css";

import Navbar from "@/components/admin-components/Navbar";

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white">
      <Navbar />
      {children}
    </div>
  );
}
