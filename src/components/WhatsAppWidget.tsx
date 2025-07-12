"use client";
import { FloatingWhatsApp } from "react-floating-whatsapp";

const WhatsAppWidget = () => {
  return (
    <FloatingWhatsApp
      phoneNumber="+8801312223452"
      accountName="Rinors Corporation"
      avatar="/images/brand/rinors-wa.jpg"
    />
  );
};

export default WhatsAppWidget;
