import QRCode from 'qrcode';
import { DeliveryStatus } from '../services/LocalDeliveryService';
import { ExamBlockchain } from './blockchain';

// Types
export interface ExamPackage {
  packageId: string;
  subject: string;
  totalPapers: number;
  sealNumber: string;
  authorityDetails: {
    officerId: string;
    name: string;
    designation: string;
  };
}

export interface VerificationData {
  hash: string;
  timestamp: number;
  location: [number, number];
  status: DeliveryStatus;
  verifiedBy: string;
}

// Generate blockchain-style hash
export async function generateBlockchainHash(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

// Generate QR code for verification
export async function generateVerificationQR(data: any): Promise<string> {
  const verificationData = {
    ...data,
    timestamp: Date.now(),
    verificationHash: await generateBlockchainHash(data)
  };

  // Add to blockchain
  const blockchain = ExamBlockchain.getInstance();
  await blockchain.addBlock({
    packageId: data.packageId,
    timestamp: Date.now(),
    location: data.location,
    action: 'CHECKPOINT',
    verifier: {
      id: data.verifiedBy,
      role: 'DELIVERY_AGENT'
    },
    evidence: {
      sealCondition: true,
      qrData: JSON.stringify(verificationData)
    }
  });

  return await QRCode.toDataURL(JSON.stringify(verificationData));
}

// Verify hash chain
export async function verifyHashChain(hashes: string[]): Promise<boolean> {
  const blockchain = ExamBlockchain.getInstance();
  return await blockchain.verifyChain();
}

// Digital signature generation (simplified for demo)
export async function signDelivery(data: any): Promise<string> {
  const message = JSON.stringify(data);
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', messageBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify package condition
export interface PackageCondition {
  sealIntact: boolean;
  packageIntact: boolean;
  temperatureOk: boolean;
  humidityOk: boolean;
}

export function checkPackageCondition(sealNumber: string): PackageCondition {
  // In a real system, this would check physical sensors
  return {
    sealIntact: true,
    packageIntact: true,
    temperatureOk: true,
    humidityOk: true
  };
}

// Get verification history from blockchain
export function getVerificationHistory(packageId: string): VerificationData[] {
  const blockchain = ExamBlockchain.getInstance();
  const history = blockchain.getPackageHistory(packageId);
  
  return history.map(block => ({
    hash: block.hash,
    timestamp: block.data.timestamp,
    location: block.data.location,
    status: 'VERIFIED' as DeliveryStatus,
    verifiedBy: block.data.verifier.id
  }));
}

// QR code scanning simulation
export async function scanQRCode(packageId: string): Promise<{
  hash: string;
  packageId: string;
  sealNumber: string;
  timestamp: number;
  examDetails?: any;
}> {
  const blockchain = ExamBlockchain.getInstance();
  const history = blockchain.getPackageHistory(packageId);
  const lastVerification = history[history.length - 1];

  if (!lastVerification) {
    throw new Error('No verification history found for package');
  }

  return {
    hash: lastVerification.hash,
    packageId,
    sealNumber: `SEAL_${packageId}`,
    timestamp: lastVerification.data.timestamp
  };
}

interface DriverDetails {
  id: string;
  name: string;
}

export function getCurrentDriver(): DriverDetails {
  // In a real app, this would get the logged-in driver's details
  return {
    id: "DRV_001",
    name: "John Doe"
  };
}

interface PhysicalCheckParams {
  sealNumber: string;
  expectedPaperCount: number;
}

export async function performPhysicalChecks(params: PhysicalCheckParams) {
  // In a real app, this would verify physical package conditions
  return {
    sealIntact: true,
    paperCount: params.expectedPaperCount,
    hashMatch: true,
    photoEvidence: ['photo1.jpg', 'photo2.jpg']
  };
}

interface ReceiverDetails {
  id: string;
  name: string;
  designation: string;
  signature: string;
}

export async function getReceiverDetails(): Promise<ReceiverDetails> {
  // In a real app, this would get the college receiver's details
  return {
    id: "RCV_001",
    name: "Dr. Smith",
    designation: "Examination Controller",
    signature: "digital_signature_here"
  };
}

// Get blockchain statistics
export function getBlockchainStats() {
  const blockchain = ExamBlockchain.getInstance();
  return blockchain.getChainStats();
} 