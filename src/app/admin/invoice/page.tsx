"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { FileText, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface InvoiceItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  variantId?: string; // To track which specific variant was selected
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ProductVariant {
  id: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  price?: number;
  discountedPrice?: number;
  sku?: string;
}

export default function CustomInvoiceGenerator() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shippingCost, setShippingCost] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      productName: "",
      sku: "",
      quantity: 1,
      price: 0,
    },
  ]);

  // Product search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [variantAdded, setVariantAdded] = useState(false);
  const { data: productsData } = api.product.getAll.useQuery();

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: "",
      sku: "",
      quantity: 1,
      price: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost;
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoiceNumber}.pdf`);
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
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `invoice-${invoiceNumber}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    } catch (error) {
      console.error("Error generating JPG:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredProducts = productsData?.products?.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get unique variants for a product
  const getProductVariants = (product: any): ProductVariant[] => {
    if (!product.variants || !Array.isArray(product.variants)) {
      // If no variants, create a default variant with base product info
      return [{
        id: 'default',
        price: product.price,
        discountedPrice: product.discountedPrice,
        sku: product.sku,
        colorName: product.defaultColor,
        colorHex: product.defaultColorHex,
        size: product.defaultSize,
      }];
    }

    return product.variants.map((variant: any, index: number) => ({
      id: `${product.id}-${index}`,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      price: variant.price || product.price,
      discountedPrice: variant.discountedPrice,
      sku: variant.sku,
    }));
  };

  // Handle product selection
  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setSearchTerm("");
  };

  // Handle variant selection
  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    
    // Find the first empty item or create a new one
    const currentItem = items.find(item => !item.productName || item.productName.trim() === "");
    if (currentItem) {
      updateItem(currentItem.id, "productName", selectedProduct.title);
      updateItem(currentItem.id, "sku", variant.sku || selectedProduct.sku || "");
      updateItem(currentItem.id, "price", variant.discountedPrice || variant.price || selectedProduct.price);
      updateItem(currentItem.id, "color", variant.colorName || "");
      updateItem(currentItem.id, "size", variant.size || "");
      updateItem(currentItem.id, "variantId", variant.id);
      console.log("Updated existing item with variant:", variant);
    } else {
      // If no empty item found, add a new one
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        productName: selectedProduct.title,
        sku: variant.sku || selectedProduct.sku || "",
        quantity: 1,
        price: variant.discountedPrice || variant.price || selectedProduct.price,
        color: variant.colorName || "",
        size: variant.size || "",
        variantId: variant.id,
      };
      setItems([...items, newItem]);
      console.log("Added new item with variant:", variant);
    }
    
    // Show success feedback
    setVariantAdded(true);
    setTimeout(() => setVariantAdded(false), 2000);
    
    // Reset selection
    setSelectedProduct(null);
    setSelectedVariant(null);
  };

  return (
    <div className="p-4 md:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Custom Invoice Generator</h1>
        <p className="text-gray-600">Create and generate custom invoices</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder="Full address"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shippingCost">Shipping Cost</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Products</h2>
              <Button onClick={addItem} size="sm" className="flex items-center gap-2">
                <Plus size={16} />
                Add Item
              </Button>
            </div>

            {/* Product Search */}
            <div className="mb-4">
              <Label htmlFor="productSearch">Search Products (Optional)</Label>
              <Input
                id="productSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for products..."
                className="mb-2"
              />
              
              {/* Success Message */}
              {variantAdded && (
                <div className="mb-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                  ✓ Product variant added to invoice successfully!
                </div>
              )}
              
              {/* Product Search Results */}
              {searchTerm && filteredProducts.length > 0 && !selectedProduct && (
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="font-medium">{product.title}</div>
                      <div className="text-gray-600">
                        Base Price: ৳{product.price}
                        {product.discountedPrice && (
                          <span className="ml-2 text-green-600">
                            Sale: ৳{product.discountedPrice}
                          </span>
                        )}
                      </div>
                      {product.variants && product.variants.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {product.variants.length} variant(s) available
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Variant Selection */}
              {selectedProduct && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <div className="mb-3">
                    <h4 className="font-medium text-sm">Select Variant for: {selectedProduct.title}</h4>
                    <p className="text-xs text-gray-600">Choose a specific size/color variant</p>
                  </div>
                  
                  <div className="space-y-2">
                    {getProductVariants(selectedProduct).map((variant) => (
                      <div
                        key={variant.id}
                        className="p-3 border rounded-md hover:bg-white cursor-pointer transition-colors"
                        onClick={() => handleVariantSelect(variant)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {variant.colorName && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Color:</span>
                                <span className="text-sm font-medium">{variant.colorName}</span>
                                {variant.colorHex && (
                                  <div 
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: variant.colorHex }}
                                  />
                                )}
                              </div>
                            )}
                            {variant.size && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Size:</span>
                                <span className="text-sm font-medium">{variant.size}</span>
                              </div>
                            )}
                            {!variant.colorName && !variant.size && (
                              <span className="text-sm text-gray-500">Default variant</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              ৳{variant.discountedPrice || variant.price}
                            </div>
                            {variant.discountedPrice && variant.price && variant.discountedPrice < variant.price && (
                              <div className="text-xs text-gray-500 line-through">
                                ৳{variant.price}
                              </div>
                            )}
                          </div>
                        </div>
                        {variant.sku && (
                          <div className="text-xs text-gray-500 mt-1">SKU: {variant.sku}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedVariant(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium">Item {index + 1}</h3>
                    {items.length > 1 && (
                      <Button
                        onClick={() => removeItem(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Product Name</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label>SKU</Label>
                      <Input
                        value={item.sku}
                        onChange={(e) => updateItem(item.id, "sku", e.target.value)}
                        placeholder="SKU"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Color (Optional)</Label>
                      <Input
                        value={item.color || ""}
                        onChange={(e) => updateItem(item.id, "color", e.target.value)}
                        placeholder="Color"
                      />
                    </div>
                    <div>
                      <Label>Size (Optional)</Label>
                      <Input
                        value={item.size || ""}
                        onChange={(e) => updateItem(item.id, "size", e.target.value)}
                        placeholder="Size"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-right">
                    <span className="font-medium">
                      Total: ৳{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-medium">৳{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Shipping:</span>
                <span className="font-medium">৳{shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>৳{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">{isGenerating ? "Generating..." : "Download PDF"}</span>
              <span className="sm:hidden">{isGenerating ? "Generating..." : "PDF"}</span>
            </Button>
            <Button
              onClick={generateJPG}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ImageIcon size={16} />
              <span className="hidden sm:inline">{isGenerating ? "Generating..." : "Download JPG"}</span>
              <span className="sm:hidden">{isGenerating ? "Generating..." : "JPG"}</span>
            </Button>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Preview</h2>
            <div className="border rounded-lg overflow-hidden">
              <div
                ref={invoiceRef}
                className="bg-white p-4 sm:p-8 max-w-[210mm] mx-auto"
                style={{ width: "210mm", minHeight: "297mm" }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  {/* Left Side - Invoice Details */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">INVOICE</h2>
                    <div className="text-sm text-gray-600 mb-4">
                      <p><strong>Invoice #:</strong> {invoiceNumber}</p>
                      <p><strong>Date:</strong> {format(new Date(invoiceDate), "PPP")}</p>
                    </div>
                    
                    {/* Customer Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
                      <div className="text-sm text-gray-600">
                        <p><strong>Name:</strong> {customerInfo.name || "Customer Name"}</p>
                        <p><strong>Email:</strong> {customerInfo.email || "customer@example.com"}</p>
                        <p><strong>Phone:</strong> {customerInfo.phone || "Phone Number"}</p>
                        <p><strong>Address:</strong> {customerInfo.address || "Customer Address"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side - Company Info */}
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-2 mb-3">
                      <img src="/light.png" alt="Packet BD Logo" className="w-40 h-16 object-contain" />
                      <p className="text-gray-600 text-sm">Your Trusted Packaging Partner</p>
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
                      {items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{item.productName || "Product Name"}</p>
                              {item.color && <p className="text-gray-600">Color: {item.color}</p>}
                              {item.size && <p className="text-gray-600">Size: {item.size}</p>}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                            {item.sku || "N/A"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                            {item.quantity}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                            ৳{item.price.toFixed(2)}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium">
                            ৳{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">৳{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Shipping:</span>
                      <span className="text-sm font-medium">৳{shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Tax:</span>
                      <span className="text-sm font-medium">৳0.00</span>
                    </div>
                    <div className="flex justify-between py-3 bg-gray-50 px-3">
                      <span className="text-lg font-bold text-gray-800">Total:</span>
                      <span className="text-lg font-bold text-gray-800">৳{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Payment Terms:</h4>
                      <p className="text-xs text-gray-600">Payment is due upon receipt of this invoice.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Thank You:</h4>
                      <p className="text-xs text-gray-600">Thank you for choosing Packet BD for your packaging needs!</p>
                    </div>
                  </div>
                  <div className="mt-6 text-center text-xs text-gray-500">
                    <p>This is a computer-generated invoice. No signature required.</p>
                    <p>Packet BD - Making packaging simple and secure.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 