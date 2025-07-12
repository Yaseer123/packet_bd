import { type Option } from "@/components/ui/multiple-selector";

export const BLOG_TAG_OPTIONS: Option[] = [
  { label: "Solar Panels", value: "solar-panels" },
  { label: "Solar Inverters", value: "solar-inverters" },
  { label: "Solar Batteries", value: "solar-batteries" },
  { label: "Solar Charge Controllers", value: "solar-charge-controllers" },
  { label: "Solar Mounting Systems", value: "solar-mounting-systems" },
  { label: "Solar Cables", value: "solar-cables" },
  { label: "Solar Connectors", value: "solar-connectors" },
  { label: "Solar Monitoring Systems", value: "solar-monitoring-systems" },
  { label: "Solar Protection Devices", value: "solar-protection-devices" },
];

// Order status color and badge variant mapping
export const ORDER_STATUS_COLORS: Record<
  string,
  { label: string; color: string }
> = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-400 text-black",
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-blue-500 text-white",
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-purple-400 text-white",
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-500 text-black",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-500 text-white",
  },
};
