"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal, Tag } from "lucide-react";
import { EditSaleBanner } from "@/components/admin-components/EditSaleBanner";
import { SliderManager } from "@/components/admin-components/SliderManager";

export default function AdminSliderPage() {
  return (
    <div className="mx-auto max-w-7xl p-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">
        Banner Management
      </h1>

      <Tabs defaultValue="slider" className="w-full space-y-6">
        <TabsList className="inline-flex h-14 items-center justify-center rounded-lg bg-gray-100 p-1">
          <TabsTrigger
            value="slider"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Slider Management
          </TabsTrigger>
          <TabsTrigger
            value="sale"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Tag className="h-4 w-4" />
            Sale Banner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slider" className="rounded-lg border bg-white p-6">
          <SliderManager />
        </TabsContent>

        <TabsContent value="sale" className="rounded-lg border bg-white p-6">
          <EditSaleBanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
