"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { deliveryService, DeliveryPackage } from "../services/LocalDeliveryService";
import DeliveryStatusPanel from "./DeliveryStatusPanel";
import VerificationModal from "./VerificationModal";
import VerificationQR from "./VerificationQR";
import BlockchainHistory from './BlockchainHistory';
import { ExamBlockchain } from '../utils/blockchain';
import Script from 'next/script';

// Add type declarations for Google Translate
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: new (options: { pageLanguage: string }, element: string) => void;
      };
    };
    googleTranslateElementInit: () => void;
  }
}

type LatLngTuple = [number, number];

// Define custom truck icon
const truckIcon = new L.Icon({
  iconUrl: "/truck-color.png",
  iconSize: [64, 64],
  iconAnchor: [32, 32],
  popupAnchor: [0, -32],
});

// Define colored markers for different locations
const boardOfficeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const collegeColors = ["green", "violet", "orange"];
const collegeIcons = collegeColors.map(color => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}));

// Sample data for board office and colleges
const boardOffice = {
  name: "Maharashtra State Board of Secondary and Higher Secondary Education",
  position: [19.074785657904986, 73.00135791133184] as LatLngTuple,
};

const colleges = [
  {
    id: 1,
    name: "K.J. Somaiya Institue Of Engineering & Information Technology",
    position: [19.04646930438961, 72.87091799413106] as LatLngTuple,
  },
  {
    id: 2,
    name: "K. J. Somaiya College of Engineering",
    position: [19.07385064882386, 72.90041353857931] as LatLngTuple,
  },
  {
    id: 3,
    name: "Bharatiya Vidya Bhavan's Sardar Patel Institute of Technology (SPIT)",
    position: [19.12334990728273, 72.83616904016924] as LatLngTuple,
  },
];

export default function DeliveryMap() {
  const [truckPosition, setTruckPosition] = useState(boardOffice.position);
  const [currentRoute, setCurrentRoute] = useState(0);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryPackage | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [currentCollege, setCurrentCollege] = useState<typeof colleges[0] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [deliveryComplete, setDeliveryComplete] = useState(false);
  const [verifiedColleges, setVerifiedColleges] = useState<number[]>([]);

  const initDelivery = async () => {
    const delivery = await deliveryService.initiateDelivery(
      'board_admin',
      'EXAM_2024_001',
      colleges
    );

    // Add initial sealing block to blockchain
    const blockchain = ExamBlockchain.getInstance();
    await blockchain.addBlock({
      packageId: delivery.packageId,
      timestamp: Date.now(),
      location: boardOffice.position,
      action: 'SEAL',
      verifier: {
        id: 'board_admin',
        role: 'AUTHORITY'
      },
      evidence: {
        sealCondition: true,
        qrData: JSON.stringify({
          packageId: delivery.packageId,
          hash: delivery.examHash,
          sealNumber: `SEAL_${delivery.packageId}`,
          timestamp: Date.now()
        })
      }
    });

    setActiveDelivery(delivery);
    setVerifiedColleges([]);
    setDeliveryComplete(false);
    setCurrentRoute(0);
    setTruckPosition(boardOffice.position);
  };

  // Initialize delivery
  useEffect(() => {
    initDelivery();
  }, []);

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!activeDelivery) return 0;
    return Math.round((verifiedColleges.length / colleges.length) * 100);
  };

  // Handle truck animation
  useEffect(() => {
    let isMoving = false;
    let cleanup = false;

    const moveTruck = async () => {
      if (isMoving || animationPaused || deliveryComplete) return;
      isMoving = true;

      try {
        // Move to next college
        const startPos = currentRoute === 0 ? boardOffice.position : colleges[currentRoute - 1].position;
        const endPos = colleges[currentRoute].position;
        
        const steps = 100;
        for (let step = 0; step <= steps && !cleanup; step++) {
          if (animationPaused) break;
          
          const lat = startPos[0] + (endPos[0] - startPos[0]) * (step / steps);
          const lng = startPos[1] + (endPos[1] - startPos[1]) * (step / steps);
          setTruckPosition([lat, lng]);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        if (!cleanup && !animationPaused) {
          setCurrentCollege(colleges[currentRoute]);
          setShowVerification(true);
          setIsVerifying(true);
          setAnimationPaused(true);
        }
      } finally {
        isMoving = false;
      }
    };

    if (!animationPaused && !isMoving && currentRoute < colleges.length && !deliveryComplete) {
      moveTruck();
    }

    return () => {
      cleanup = true;
    };
  }, [currentRoute, animationPaused, deliveryComplete]);

  // Handle verification completion
  const handleVerificationComplete = async () => {
    if (currentCollege) {
      await deliveryService.confirmDelivery('EXAM_2024_001', currentCollege.id);

      // Add delivery verification to blockchain
      const blockchain = ExamBlockchain.getInstance();
      await blockchain.addBlock({
        packageId: activeDelivery?.packageId || '',
        timestamp: Date.now(),
        location: currentCollege.position,
        action: 'DELIVERY',
        verifier: {
          id: 'college_receiver',
          role: 'RECEIVER'
        },
        evidence: {
          sealCondition: true,
          qrData: JSON.stringify({
            packageId: activeDelivery?.packageId,
            collegeId: currentCollege.id,
            timestamp: Date.now(),
            status: 'VERIFIED'
          })
        }
      });

      setIsVerifying(false);
      setShowVerification(false);
      setVerifiedColleges(prev => [...prev, currentCollege.id]);
      setCurrentCollege(null);
      setAnimationPaused(false);

      if (currentRoute === colleges.length - 1) {
        // Last college - return to board office
        setDeliveryComplete(true);
        const steps = 100;
        const startPos = colleges[currentRoute].position;
        
        for (let step = 0; step <= steps; step++) {
          const lat = startPos[0] + (boardOffice.position[0] - startPos[0]) * (step / steps);
          const lng = startPos[1] + (boardOffice.position[1] - startPos[1]) * (step / steps);
          setTruckPosition([lat, lng]);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Reset for next delivery round after a delay
        setTimeout(() => {
          initDelivery();
        }, 5000);
      } else {
        // Move to next college
        setCurrentRoute(prev => prev + 1);
      }
    }
  };

  // Add Google Translate initialization
  useEffect(() => {
    // Define the translation initialization function
    const googleTranslateElementInit = () => {
      if (typeof window !== 'undefined' && window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
      }
    };

    // Add the function to window object
    window.googleTranslateElementInit = googleTranslateElementInit;
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Google Translate Element - Compact Version */}
      {/* <div className="bg-white border-b border-gray-100 py-1 px-4">
        <div id="google_translate_element" className="scale-90 origin-left"></div>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
          onError={() => {
            console.error('Failed to load Google Translate script');
          }}
        />
      </div> */}
      

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-1/4 flex flex-col bg-gray-50 border-r border-gray-200">
          {/* Scrollable container for all left panel content */}
          <div className="flex-1 overflow-y-auto">
            {/* Delivery Status Panel */}
            <div className="p-4">
              <DeliveryStatusPanel
                delivery={activeDelivery}
                currentRoute={currentRoute}
                boardOffice={boardOffice}
                colleges={colleges}
                verifiedColleges={verifiedColleges}
                progress={calculateProgress()}
              />
            </div>

            {/* QR Code Section */}
            {showVerification && currentCollege && activeDelivery && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <h3 className="text-lg font-semibold mb-4">Package Verification</h3>
                <VerificationQR
                  packageId={activeDelivery.packageId}
                  location={currentCollege.position}
                  status={activeDelivery.status}
                  verifiedBy="delivery_agent"
                  onVerified={handleVerificationComplete}
                />
              </div>
            )}

            {/* Blockchain History */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <BlockchainHistory />
            </div>
          </div>
        </div>

        {/* Map container */}
        <div className="flex-1">
          <MapContainer
            center={[19.0760, 72.8777]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Board Office Marker */}
            <Marker position={boardOffice.position} icon={boardOfficeIcon}>
              <Popup>
                <div className="font-bold text-red-600">{boardOffice.name}</div>
                <div>Central Examination Authority</div>
                {activeDelivery && (
                  <div className="mt-2">
                    <div>Package ID: {activeDelivery.packageId}</div>
                    <div>Status: {activeDelivery.status}</div>
                  </div>
                )}
              </Popup>
            </Marker>

            {/* College Markers */}
            {colleges.map((college, index) => (
              <Marker key={college.id} position={college.position} icon={collegeIcons[index]}>
                <Popup>
                  <div className="font-bold">{college.name}</div>
                  <div>Status: {
                    activeDelivery?.colleges[index].confirmed 
                      ? "Delivered & Verified" 
                      : currentRoute > index 
                        ? "In Progress"
                        : "Pending"
                  }</div>
                </Popup>
              </Marker>
            ))}

            {/* Truck Marker */}
            <Marker position={truckPosition} icon={truckIcon}>
              <Popup>
                <div className="font-bold">Delivery Vehicle</div>
                <div>Transporting Examination Papers</div>
                {activeDelivery && (
                  <div className="mt-2">
                    <div>Package: {activeDelivery.packageId}</div>
                    <div>Hash: {activeDelivery.examHash}</div>
                  </div>
                )}
              </Popup>
            </Marker>

            {/* Route Lines */}
            {currentRoute > 0 && (
              <Polyline
                positions={[
                  boardOffice.position,
                  ...colleges.slice(0, currentRoute).map(c => c.position)
                ]}
                color="blue"
                weight={3}
                opacity={0.6}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
} 