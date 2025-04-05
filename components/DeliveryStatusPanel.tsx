import { DeliveryPackage } from "../services/LocalDeliveryService";
import { useState } from "react";
import { 
  scanQRCode, 
  generateBlockchainHash, 
  checkPackageCondition, 
  verifyHashChain, 
  signDelivery,
  getCurrentDriver,
  getVerificationHistory,
  performPhysicalChecks,
  getReceiverDetails 
} from "../utils/verification";

interface DeliveryStatusPanelProps {
  delivery: DeliveryPackage | null;
  currentRoute: number;
  boardOffice: {
    name: string;
    position: [number, number];
  };
  colleges: Array<{
    id: number;
    name: string;
    position: [number, number];
  }>;
  verifiedColleges: number[];
  progress: number;
}

interface InitialSealing {
  packageId: string;
  examDetails: {
    subject: string;
    totalPapers: number;
    sealNumber: string;
    packingTime: number;
  };
  authorityDetails: {
    officerId: string;
    designation: string;
    signature: string;
  };
  verificationData: {
    initialHash: string;
    qrCode: string;
    sealingPhotos: string[];
  };
}

interface CheckpointVerification {
  packageId: string;
  checkpointData: {
    location: [number, number];
    timestamp: number;
    checkpointId: string;
    driverDetails: {
      id: string;
      name: string;
    };
  };
  packageCondition: {
    sealIntact: boolean;
    packageIntact: boolean;
    photoEvidence: string;
  };
  verificationHash: string;
}

interface DeliveryVerification {
  packageId: string;
  collegeId: number;
  receiverDetails: {
    id: string;
    name: string;
    designation: string;
    signature: string;
  };
  verificationChecks: {
    sealIntact: boolean;
    paperCount: number;
    hashMatch: boolean;
    photoEvidence: string[];
  };
  finalVerification: {
    timestamp: number;
    location: [number, number];
    verificationHash: string;
    digitalSignature: string;
  };
}

interface VerificationUI {
  // Different screens for each step
  screens: {
    initialSealing: React.FC;
    transitCheckpoint: React.FC;
    finalDelivery: React.FC;
  };
  // Status tracking
  verificationStatus: {
    sealingComplete: boolean;
    transitChecks: boolean[];
    deliveryComplete: boolean;
  };
}

interface ExamDetails {
  subject: string;
  totalPapers: number;
  sealNumber: string;
  packingTime: number;
}

interface AuthorityDetails {
  officerId: string;
  designation: string;
  signature: string;
}

export default function DeliveryStatusPanel({ delivery, currentRoute, boardOffice, colleges, verifiedColleges, progress }: DeliveryStatusPanelProps) {
  const [showFullHash, setShowFullHash] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!delivery) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-gray-500';
      case 'IN_TRANSIT': return 'text-blue-500';
      case 'DELIVERED': return 'text-green-500';
      case 'VERIFIED': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'Not started';
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(delivery.examHash);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  };

  const formatHash = (hash: string) => {
    if (showFullHash) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const sealPackage = async (examDetails: ExamDetails, authorityDetails: AuthorityDetails) => {
    // 1. Generate unique package ID
    const packageId = `EXAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 2. Create initial hash including all details
    const initialData = {
      packageId,
      examDetails,
      authorityDetails,
      timestamp: Date.now(),
      gpsLocation: [boardOffice.position[0], boardOffice.position[1]]
    };
    
    // 3. Generate QR code with verification data
    const qrData = {
      hash: await generateBlockchainHash(initialData),
      packageId,
      sealNumber: examDetails.sealNumber,
      timestamp: Date.now()
    };

    return {
      packageId,
      examDetails,
      authorityDetails,
      verificationData: {
        initialHash: qrData.hash,
        qrCode: JSON.stringify(qrData),
        sealingPhotos: [] // To be added during physical sealing
      }
    };
  };

  const verifyAtCheckpoint = async (packageId: string, location: [number, number]) => {
    // 1. Scan existing QR
    const previousData = await scanQRCode(packageId);
    
    // 2. Verify seal and package condition
    const condition = await checkPackageCondition(packageId);
    
    // 3. Generate new checkpoint hash
    const checkpointData = {
      previousHash: previousData.hash,
      location,
      timestamp: Date.now(),
      condition
    };
    
    // 4. Create new QR for next checkpoint
    const newHash = await generateBlockchainHash(checkpointData);
    
    return {
      packageId,
      checkpointData: {
        location,
        timestamp: Date.now(),
        checkpointId: `CP_${Date.now()}`,
        driverDetails: getCurrentDriver()
      },
      packageCondition: condition,
      verificationHash: newHash
    };
  };

  const verifyDelivery = async (packageId: string, collegeId: number) => {
    // 1. Scan final QR code
    const deliveryData = await scanQRCode(packageId);
    
    // 2. Verify complete chain of custody
    const verificationHistory = getVerificationHistory(packageId);
    const chainValid = await verifyHashChain(verificationHistory.map(record => record.hash));
    
    // 3. Physical verification
    const physicalChecks = await performPhysicalChecks({
      sealNumber: deliveryData.sealNumber,
      expectedPaperCount: deliveryData.examDetails.totalPapers
    });
    
    // 4. Generate final verification hash
    const finalHash = await generateBlockchainHash({
      ...deliveryData,
      deliveryTime: Date.now(),
      collegeId,
      physicalChecks
    });

    return {
      packageId,
      collegeId,
      receiverDetails: await getReceiverDetails(),
      verificationChecks: physicalChecks,
      finalVerification: {
        timestamp: Date.now(),
        location: colleges.find(c => c.id === collegeId)?.position || [0, 0],
        verificationHash: finalHash,
        digitalSignature: await signDelivery(finalHash)
      }
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Delivery Status</h2>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Package ID:</span>
            <span className="font-mono">{delivery.packageId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-semibold ${getStatusColor(delivery.status)}`}>
              {delivery.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Departure Time:</span>
            <span>{formatTime(delivery.departureTime)}</span>
          </div>
        </div>
      </div>

      {/* New Hash Display Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Exam Hash</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFullHash(!showFullHash)}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              {showFullHash ? 'Show Less' : 'Show Full Hash'}
            </button>
            <button
              onClick={copyToClipboard}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
            >
              {copySuccess ? '✓ Copied!' : 'Copy Hash'}
            </button>
          </div>
          <div className="font-mono text-sm bg-white p-3 rounded border break-all">
            {formatHash(delivery.examHash)}
          </div>
          <div className="text-xs text-gray-500">
            This cryptographic hash ensures the integrity of the exam package
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-red-50 rounded p-3">
          <h3 className="font-semibold text-red-700">{boardOffice.name}</h3>
          <p className="text-sm text-red-600">Central Examination Authority</p>
        </div>

        {delivery.colleges.map((college, index) => (
          <div 
            key={college.id}
            className={`rounded p-3 ${
              college.confirmed
                ? 'bg-green-50'
                : currentRoute > index
                ? 'bg-blue-50'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{college.name}</h3>
                <p className="text-sm text-gray-600">
                  {college.confirmed
                    ? '✅ Delivered & Verified'
                    : currentRoute > index
                    ? '🚚 In Progress'
                    : '⏳ Pending'}
                </p>
              </div>
              <span className={`text-sm font-medium ${
                college.confirmed
                  ? 'text-green-600'
                  : currentRoute > index
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}>
                Stop {index + 1}
              </span>
            </div>
            {college.confirmed && (
              <div className="mt-2 text-sm text-gray-500">
                Confirmation Time: {formatTime(Date.now())}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-2">Delivery Progress</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {progress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 