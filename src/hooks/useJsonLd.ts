import { useEffect } from "react";

interface JsonLdData {
  "@context": string;
  "@type": string;
  id: string;
  name: string;
  description: string;
  image?: string[];
  sku: string;
  productCode?: string;
  brand: {
    "@type": string;
    name: string;
  };
  offers: {
    "@type": string;
    url: string;
    priceCurrency: string;
    price: number;
    priceValidUntil: string;
    itemCondition: string;
    availability: string;
  };
  category?: string;
  mpn: string;
  gtin: string;
}

export const useJsonLd = (jsonLdData: JsonLdData, productSlug: string) => {
  useEffect(() => {
    // Remove any existing JSON-LD scripts
    const existingScripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    existingScripts.forEach((script) => {
      if (script.id.includes("json-ld")) {
        script.remove();
      }
    });

    // Create new JSON-LD script
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `json-ld-${productSlug}`;
    script.textContent = JSON.stringify(jsonLdData);

    // Add to document head
    document.head.appendChild(script);

    // Debug logging
    console.log("JSON-LD updated for product:", {
      slug: productSlug,
      productCode: jsonLdData.productCode,
      id: jsonLdData.id,
      name: jsonLdData.name,
    });

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(`json-ld-${productSlug}`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [jsonLdData, productSlug]);
};
