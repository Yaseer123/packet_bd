import { Toaster } from "@/components/ui/sonner";
import "@/styles/styles.scss";
import { TRPCReactProvider } from "@/trpc/react";
import { GeistSans } from "geist/font/sans";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta title="Rinors E-commerce" />
        <meta
          name="description"
          content="Your one-stop shop for premium products. Discover our curated collection of quality items with secure shopping and fast delivery."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TXM9N777');
          `,
        }}
      />
      {/* End Google Tag Manager */}
      <body className="bg-[#F2F4F7]">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TXM9N777"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
