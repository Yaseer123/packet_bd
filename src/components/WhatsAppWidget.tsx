"use client";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { useEffect, useState } from "react";

const WhatsAppWidget = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <FloatingWhatsApp
      phoneNumber="+8801824443227"
      accountName="Packet BD"
      avatar="/images/brand/packetbd.jpg"
    />
  );
};

export default WhatsAppWidget;
