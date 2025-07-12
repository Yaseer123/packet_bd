import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AddressTab({ activeTab }: { activeTab?: string }) {
  const [address, setAddress] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  });

  const { data: fetchedAddress } = api.address.getAddress.useQuery();

  useEffect(() => {
    if (fetchedAddress) {
      setAddress({
        name: fetchedAddress.name || "",
        street: fetchedAddress.street || "",
        city: fetchedAddress.city || "",
        state: fetchedAddress.state || "",
        zip: fetchedAddress.zipCode || "",
        phone: fetchedAddress.phone || "",
        email: fetchedAddress.email || "",
      });
    }
  }, [fetchedAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setAddress((prev) => ({ ...prev, [id]: value }));
  };

  const updateAddressMutation = api.address.updateAddress.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAddressMutation.mutateAsync({
        name: address.name,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zip,
        phone: address.phone,
        email: address.email,
      });
    } catch (error) {
      console.error("Failed to update address:", error);
      toast("Failed to update address. Please try again.");
    }
  };

  return (
    <div
      className={`tab_address text-content w-full rounded-xl border border-[#ddd] p-7 focus:border-[#ddd] ${activeTab === "address" ? "block" : "hidden"}`}
    >
      <form onSubmit={handleSubmit}>
        <div className={`form_address`}>
          <h6 className="heading6 border-b-line mb-4 border-b-2 p-2">
            Shipping Address
          </h6>
          <div className="mt-5 grid gap-4 gap-y-5 sm:grid-cols-2">
            <div className="name">
              <label htmlFor="name" className="caption1 capitalize">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="name"
                type="text"
                value={address.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="street">
              <label htmlFor="street" className="caption1 capitalize">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="street"
                type="text"
                value={address.street}
                onChange={handleChange}
                required
              />
            </div>
            <div className="city">
              <label htmlFor="city" className="caption1 capitalize">
                Town / City <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="city"
                type="text"
                value={address.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="state">
              <label htmlFor="state" className="caption1 capitalize">
                State <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="state"
                type="text"
                value={address.state}
                onChange={handleChange}
                required
              />
            </div>
            <div className="zip">
              <label htmlFor="zip" className="caption1 capitalize">
                ZIP <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="zip"
                type="text"
                value={address.zip}
                onChange={handleChange}
                required
              />
            </div>
            <div className="phone">
              <label htmlFor="phone" className="caption1 capitalize">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="phone"
                type="text"
                value={address.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="email">
              <label htmlFor="email" className="caption1 capitalize">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="mt-2 w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="email"
                type="email"
                value={address.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="block-button mt-6 lg:mt-10">
          <button
            type="submit"
            className="button-main disabled:cursor-not-allowed disabled:opacity-50"
            disabled={updateAddressMutation.isPending}
          >
            {updateAddressMutation.isPending ? "Updating..." : "Update Address"}
          </button>
        </div>
      </form>
    </div>
  );
}
