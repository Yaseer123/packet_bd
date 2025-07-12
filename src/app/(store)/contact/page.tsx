"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { api } from "@/trpc/react";
import { HomeIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const validateEmail = (email: string) => {
  // Simple email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateName = (name: string) => {
  return name.trim().length >= 2;
};

const validateMessage = (message: string) => {
  return message.trim().length > 0;
};

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    message: false,
  });

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "name":
        if (!validateName(value)) return "Name must be at least 2 characters.";
        break;
      case "email":
        if (!validateEmail(value)) return "Invalid email address.";
        break;
      case "message":
        if (!validateMessage(value)) return "Message cannot be empty.";
        break;
      default:
        return "";
    }
    return "";
  };

  const contactMutation = api.contact.create.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const isFormValid =
    validateName(formData.name) &&
    validateEmail(formData.email) &&
    validateMessage(formData.message) &&
    !errors.name &&
    !errors.email &&
    !errors.message;

  const breadcrumbItems = [
    {
      label: <HomeIcon size={16} />,
      href: "/",
    },
    {
      label: "Contact us",
    },
  ];

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Contact us" />
      </div>
      <div className="contact-us py-10 md:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-4">
          <div className="flex justify-between gap-y-10 max-lg:flex-col">
            <div className="left lg:w-2/3 lg:pr-4">
              <div className="text-[36px] font-semibold capitalize leading-[40px] md:text-[20px] md:leading-[28px] lg:text-[30px] lg:leading-[38px]">
                Drop Us A Line
              </div>
              <div className="body1 text-secondary2 mt-3">
                Use the form below to get in touch with the sales team
              </div>
              <form className="mt-4 md:mt-6" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-4 gap-y-5 sm:grid-cols-2">
                  <div className="name">
                    <input
                      className="w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                      name="name"
                      type="text"
                      placeholder="Your Name *"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.name && errors.name && (
                      <div className="mt-1 text-xs text-red-500">
                        {errors.name}
                      </div>
                    )}
                  </div>
                  <div className="email">
                    <input
                      className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                      name="email"
                      type="email"
                      placeholder="Your Email *"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.email && errors.email && (
                      <div className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </div>
                    )}
                  </div>
                  <div className="message sm:col-span-2">
                    <textarea
                      className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                      name="message"
                      rows={3}
                      placeholder="Your Message *"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.message && errors.message && (
                      <div className="mt-1 text-xs text-red-500">
                        {errors.message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 md:mt-6">
                  <button
                    type="submit"
                    disabled={contactMutation.isPending || !isFormValid}
                    className="duration-400 hover:bg-green inline-block cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 disabled:opacity-50 md:rounded-[8px] md:px-4 md:py-2.5 md:text-sm md:leading-4 lg:rounded-[10px] lg:px-6 lg:py-3"
                  >
                    {contactMutation.isPending ? "Sending..." : "Send message"}
                  </button>
                </div>
              </form>
            </div>
            <div className="right lg:w-1/4 lg:pl-4">
              <div className="item">
                <div className="text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                  Our Store
                </div>
                <p className="mt-3">41/5 East Badda Dhaka, Bangladesh</p>
                <p className="mt-3">
                  Phone:{" "}
                  <span className="whitespace-nowrap">+8801312223452</span>
                </p>
                <p className="mt-1">
                  Email:{" "}
                  <span className="whitespace-nowrap">contact@rinors.com</span>
                </p>
              </div>
              <div className="item mt-10">
                <div className="text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                  Open Hours
                </div>
                <p className="mt-3">
                  Sunday:{" "}
                  <span className="whitespace-nowrap">9:00am - 5:00pm</span>
                </p>
                <p className="mt-3">
                  monday:{" "}
                  <span className="whitespace-nowrap">9:00am - 5:00pm</span>
                </p>
                <p className="mt-3">
                  Tuesday:{" "}
                  <span className="whitespace-nowrap">9:00am - 5:00pm</span>
                </p>
                <p className="mt-3">
                  Wednesday:{" "}
                  <span className="whitespace-nowrap">9:00am - 5:00pm</span>
                </p>
                <p className="mt-3">
                  Thursday:{" "}
                  <span className="whitespace-nowrap">9:00am - 5:00pm</span>
                </p>
                <p className="mt-3"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
