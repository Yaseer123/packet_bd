"use client";

import { Button } from "@/components/ui/button";
import { type RouterOutputs } from "@/trpc/react";
import { format } from "date-fns";
import { FileText, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

type OrderType = RouterOutputs["order"]["getOrderByIdAdmin"];

interface InvoiceGeneratorProps {
  order: OrderType;
}

// Type definitions for external libraries
interface Html2CanvasOptions {
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  backgroundColor?: string;
}

interface Html2CanvasInstance {
  toDataURL(type: string, quality?: number): string;
  width: number;
  height: number;
}

interface JsPDFInstance {
  internal: {
    pageSize: {
      getWidth(): number;
      getHeight(): number;
    };
  };
  addImage(
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void;
  save(filename: string): void;
}

export default function InvoiceGenerator({ order }: InvoiceGeneratorProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Early return if order is null
  if (!order) {
    return <div>No order data available</div>;
  }

  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    setIsGenerating(true);
    try {
      // Dynamic import with proper type assertions
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const html2canvasModule = await import("html2canvas");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsPDFModule = await import("jspdf");

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const html2canvas = html2canvasModule.default as (
        element: HTMLElement,
        options?: Html2CanvasOptions,
      ) => Promise<Html2CanvasInstance>;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const jsPDF = jsPDFModule.default as new (
        orientation: string,
        unit: string,
        format: string,
      ) => JsPDFInstance;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${order.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateJPG = async () => {
    if (!invoiceRef.current) return;

    setIsGenerating(true);
    try {
      // Dynamic import with proper type assertions
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const html2canvasModule = await import("html2canvas");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const html2canvas = html2canvasModule.default as (
        element: HTMLElement,
        options?: Html2CanvasOptions,
      ) => Promise<Html2CanvasInstance>;

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `invoice-${order.id}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    } catch (error) {
      console.error("Error generating JPG:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateSubtotal = (): number => {
    return (
      order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
      0
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          <span className="hidden sm:inline">
            {isGenerating ? "Generating..." : "Download PDF"}
          </span>
          <span className="sm:hidden">
            {isGenerating ? "Generating..." : "PDF"}
          </span>
        </Button>
        <Button
          onClick={generateJPG}
          disabled={isGenerating}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ImageIcon size={16} />
          <span className="hidden sm:inline">
            {isGenerating ? "Generating..." : "Download JPG"}
          </span>
          <span className="sm:hidden">
            {isGenerating ? "Generating..." : "JPG"}
          </span>
        </Button>
      </div>

      {/* Invoice Template - Hidden by default, shown when generating */}
      <div
        ref={invoiceRef}
        className="mx-auto max-w-[210mm] border bg-white p-4 sm:p-8"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          {/* Left Side - Invoice Details */}
          <div className="flex-1">
            <h2 className="mb-4 text-3xl font-bold text-gray-800">INVOICE</h2>
            <div className="mb-4 text-sm text-gray-600">
              <p>
                <strong>Invoice #:</strong> {order.id}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {format(new Date(order.createdAt), "PPP")}
              </p>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Bill To:
              </h3>
              {order.user && order.address && (
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Name:</strong> {order.user.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.user.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.address.phone}
                  </p>
                  <p>
                    <strong>Address:</strong> {order.address.street},{" "}
                    {order.address.city}, {order.address.state}{" "}
                    {order.address.zipCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Company Info */}
          <div className="text-right">
            <div className="mb-3 flex flex-col items-end gap-2">
              <img
                src="/light.png"
                alt="Packet BD Logo"
                className="h-16 w-40 object-contain"
              />
              <p className="text-sm text-gray-600">
                Your Trusted Packaging Partner
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>Plot-1832, Bir Uttam Rafiqul Islam Ave</p>
              <p>Dhaka, Bangladesh</p>
              <p>Phone: 01824443227</p>
              <p>Email: contact@packetbd.com</p>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">
                  Item
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-800">
                  SKU
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-800">
                  Qty
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-800">
                  Unit Price
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-800">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {item.product?.title ?? "Product not found"}
                      </p>
                      {item.color && (
                        <p className="text-gray-600">Color: {item.color}</p>
                      )}
                      {item.size && (
                        <p className="text-gray-600">Size: {item.size}</p>
                      )}
                      {item.variantLabel && (
                        <p className="text-gray-600">
                          Variant: {item.variantLabel}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                    {item.sku ?? "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                    ৳{item.price.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm font-medium">
                    ৳{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-8 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between border-b py-2">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">
                ৳{calculateSubtotal().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-sm text-gray-600">Shipping:</span>
              <span className="text-sm font-medium">
                ৳{order.shippingCost?.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-sm text-gray-600">Tax:</span>
              <span className="text-sm font-medium">৳0.00</span>
            </div>
            <div className="flex justify-between bg-gray-50 px-3 py-3">
              <span className="text-lg font-bold text-gray-800">Total:</span>
              <span className="text-lg font-bold text-gray-800">
                ৳{order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-800">
                Payment Terms:
              </h4>
              <p className="text-xs text-gray-600">
                Payment is due upon receipt of this invoice.
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-800">
                Thank You:
              </h4>
              <p className="text-xs text-gray-600">
                Thank you for choosing Packet BD for your packaging needs!
              </p>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>This is a computer-generated invoice. No signature required.</p>
            <p>Packet BD - Making packaging simple and secure.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
