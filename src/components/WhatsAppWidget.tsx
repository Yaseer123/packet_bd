"use client";
import { FloatingWhatsApp } from "react-floating-whatsapp";

const WhatsAppWidget = () => {
  return (
    <FloatingWhatsApp
      phoneNumber="+8801312223452"
      accountName="Rinors Corporation"
      avatar="/favicon.png"
    />
  );
};

export default WhatsAppWidget;
