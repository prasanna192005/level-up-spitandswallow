"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the Map component to avoid SSR issues with Leaflet
const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
});

export default function PaperDeliveryPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Examination Paper Delivery Tracking</h1>
      <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
        <DeliveryMap />
      </div>
    </div>
  );
} 