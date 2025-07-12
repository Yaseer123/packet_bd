import Footer from "@/components/store-components/Footer";
import Menu from "@/components/store-components/Menu";
import ModalWrapper from "@/components/store-components/Modal/ModalWrapper";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { auth } from "@/server/auth";
import "@/styles/styles.scss";
import { HydrateClient } from "@/trpc/server";
import React from "react";

export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <HydrateClient>
      <Menu isAuthenticated={!!session?.user} />
      {children}
      <WhatsAppWidget />
      <Footer />
      <ModalWrapper />
    </HydrateClient>
  );
}
