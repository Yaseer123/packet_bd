"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import AddressTab from "@/components/store-components/UserDashboard/Address";
import Dashboard from "@/components/store-components/UserDashboard/Dashboard";
import OrderHistory from "@/components/store-components/UserDashboard/OrderHistory";
import { HouseLine, Package, Tag } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function MyAccountView({ user }: { user: UserAccount }) {
  const [activeTab, setActiveTab] = useState<string | undefined>("dashboard");

  const breadcrumbItems = [
    { label: <HomeIcon size={16} />, href: "/" },
    { label: "User Account" },
  ];

  return (
    <div className="bg-white">
      <div id="header" className="relative w-full">
        <Breadcrumb pageTitle="User Account" items={breadcrumbItems} />
      </div>
      <div className="profile-block py-10 md:py-20">
        <div className="container">
          <div className="content-main flex w-full gap-y-8 max-md:flex-col">
            <div className="left w-full md:w-1/3 md:pr-[16px] lg:pr-[28px] xl:pr-[3.125rem]">
              <div className="user-infor bg-surface rounded-xl px-4 py-5 md:rounded-[20px] lg:px-7 lg:py-10">
                <div className="heading flex flex-col items-center justify-center">
                  <div className="avatar">
                    <Image
                      src={user.image ?? "/images/avatar/1.png"}
                      width={300}
                      height={300}
                      alt="avatar"
                      className="h-[120px] w-[120px] rounded-full md:h-[140px] md:w-[140px]"
                    />
                  </div>
                  <div className="name heading6 mt-4 text-center">
                    {user.name}
                  </div>
                  <div className="mail heading6 mt-1 text-center font-normal normal-case">
                    {user.email}
                  </div>
                </div>
                <div className="menu-tab mt-6 w-full max-w-none lg:mt-10">
                  <button
                    className={`item flex w-full cursor-pointer items-center gap-3 rounded-lg px-5 py-4 duration-300 hover:bg-white ${activeTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setActiveTab("dashboard")}
                  >
                    <HouseLine size={20} />
                    <span>Dashboard</span>
                  </button>
                  <button
                    className={`item mt-1.5 flex w-full cursor-pointer items-center gap-3 rounded-lg px-5 py-4 duration-300 hover:bg-white ${activeTab === "orders" ? "active" : ""}`}
                    onClick={() => setActiveTab("orders")}
                  >
                    <Package size={20} />
                    <span>Orders History</span>
                  </button>
                  <button
                    className={`item mt-1.5 flex w-full cursor-pointer items-center gap-3 rounded-lg px-5 py-4 duration-300 hover:bg-white ${activeTab === "address" ? "active" : ""}`}
                    onClick={() => setActiveTab("address")}
                  >
                    <Tag size={20} />
                    <span>My Address</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="right w-full pl-2.5 md:w-2/3">
              {/* TODO: Update Dashboard, OrderHistory, and AddressTab to accept userId prop and fetch data for that user */}
              <Dashboard activeTab={activeTab} />
              <OrderHistory activeTab={activeTab} />
              <AddressTab activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
