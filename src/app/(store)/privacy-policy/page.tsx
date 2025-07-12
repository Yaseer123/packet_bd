"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { HomeIcon } from "lucide-react";

const breadcrumbItems = [
  { label: <HomeIcon size={16} />, href: "/" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

const PrivacyPolicy = () => {
  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Privacy Policy" />
      </div>
      <div className="faqs-block py-10 md:py-20">
        <div className="container">
          <div className="prose max-w-none">
            <h1>Privacy Policy</h1>
            <p>
              Your privacy is important to us. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you
              visit our website. Please read this privacy policy carefully.
            </p>
            <h2>Information We Collect</h2>
            <ul>
              <li>Personal Data: Name, email address, phone number, etc.</li>
              <li>
                Usage Data: Pages visited, time spent, and other analytics.
              </li>
            </ul>
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To allow you to participate in interactive features</li>
              <li>To provide customer support</li>
              <li>To gather analysis to improve our service</li>
            </ul>
            <h2>Disclosure of Your Information</h2>
            <p>
              We may share information with third parties that perform services
              for us or on our behalf, including payment processing, data
              analysis, email delivery, hosting services, customer service, and
              marketing assistance.
            </p>
            <h2>Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy,
              please contact us at contact@rinors.com.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
