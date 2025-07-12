import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { ORDER_STATUS_COLORS } from "@/utils/constants";
import {
  HourglassMedium,
  Package,
  ReceiptX,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

export default function Dashboard({ activeTab }: { activeTab?: string }) {
  const { data: order } = api.order.getLatestOrder.useQuery();
  const { data: orders } = api.order.getOrders.useQuery();
  console.log(orders);
  return (
    <div
      className={`tab text-content w-full ${activeTab === "dashboard" ? "block" : "hidden"}`}
    >
      <div className="overview grid gap-5 sm:grid-cols-3">
        <div className="item box-shadow-xs flex items-center justify-between rounded-lg border border-[#ddd] p-5 focus:border-[#ddd]">
          <div className="counter">
            <span className="">Awaiting Pickup</span>
            <h5 className="heading5 mt-1">
              {
                orders?.filter(
                  (order: { status: string }) => order.status === "SHIPPED",
                ).length
              }
            </h5>
          </div>
          <HourglassMedium className="text-4xl" />
        </div>
        <div className="item box-shadow-xs flex items-center justify-between rounded-lg border border-[#ddd] p-5 focus:border-[#ddd]">
          <div className="counter">
            <span className="">Cancelled Orders</span>
            <h5 className="heading5 mt-1">
              {
                orders?.filter(
                  (order: { status: string }) => order.status === "CANCELLED",
                ).length
              }
            </h5>
          </div>
          <ReceiptX className="text-4xl" />
        </div>
        <div className="item box-shadow-xs flex items-center justify-between rounded-lg border border-[#ddd] p-5 focus:border-[#ddd]">
          <div className="counter">
            <span className="">Total Number of Orders</span>
            <h5 className="heading5 mt-1">{orders?.length}</h5>
          </div>
          <Package className="text-4xl" />
        </div>
      </div>
      <div className="recent_order mt-7 rounded-xl border border-[#ddd] px-5 pb-2 pt-5 focus:border-[#ddd]">
        <h6 className="heading6">Recent Orders</h6>
        <div className="list mt-5 w-full overflow-x-auto">
          <table className="w-full max-[1400px]:w-[700px] max-md:w-[700px]">
            <thead className="border-b border-[#ddd] focus:border-[#ddd]">
              <tr>
                <th
                  scope="col"
                  className="whitespace-nowrap pb-3 text-left text-sm font-bold uppercase"
                >
                  Order
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap pb-3 text-left text-sm font-bold uppercase"
                >
                  Products
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap pb-3 text-left text-sm font-bold uppercase"
                >
                  Pricing
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap pb-3 text-right text-sm font-bold uppercase"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {order?.items?.map(
                (item: {
                  id: string;
                  product: {
                    slug: string;
                    id: string;
                    images: string[];
                    title: string;
                    brand: string;
                  };
                  price: number;
                }) => (
                  <tr key={item.id} className="item duration-300">
                    <th scope="row" className="py-3 text-left">
                      <strong className="text-title">{item.id}</strong>
                    </th>
                    <td className="py-3">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="product flex items-center gap-3"
                      >
                        <Image
                          src={
                            item.product.images[0] ??
                            "/images/product/1000x1000.png"
                          }
                          width={400}
                          height={400}
                          alt="V-neck knitted top"
                          className="h-12 w-12 flex-shrink-0 rounded"
                        />
                        <div className="info flex flex-col">
                          <strong className="product_name text-button">
                            {item.product.title}
                          </strong>
                          <span className="product_tag caption1">
                            {item.product.brand}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="price py-3">{item.price}</td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={undefined}
                        className={ORDER_STATUS_COLORS[order?.status]?.color}
                      >
                        {ORDER_STATUS_COLORS[order?.status]?.label ??
                          order?.status}
                      </Badge>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
