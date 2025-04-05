"use client";

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ExamBlockchain } from '../utils/blockchain';
import { generateBlockchainHash } from '../utils/verification';
import { generateVerificationQR } from '../utils/verification';
import { DeliveryStatus } from '../services/LocalDeliveryService';

interface VerificationQRProps {
  packageId: string;
  location: [number, number];
  status: DeliveryStatus;
  verifiedBy: string;
  onVerified: () => void;
}

export default function VerificationQR({ packageId, location, status, verifiedBy, onVerified }: VerificationQRProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [qrData, setQrData] = useState('');

  // Generate verification code once when component mounts or package changes
  useEffect(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    
    // Generate QR data
    const data = JSON.stringify({
      packageId,
      code,
      timestamp: Date.now()
    });
    setQrData(data);
  }, [packageId]);

  const handleVerification = async () => {
    if (verificationCode !== generatedCode) {
      setError('Invalid verification code. Please try again.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Create verification data
      const verificationData = {
        packageId,
        timestamp: Date.now(),
        location,
        action: 'CHECKPOINT' as const,
        verifier: {
          id: verifiedBy,
          role: 'DELIVERY_AGENT'
        },
        status
      };

      // Generate hash for the verification
      const verificationHash = await generateBlockchainHash(verificationData);

      // Add to blockchain
      const blockchain = ExamBlockchain.getInstance();
      await blockchain.addBlock({
        ...verificationData,
        evidence: {
          sealCondition: true,
          qrData: JSON.stringify({
            verificationCode: generatedCode,
            timestamp: Date.now()
          })
        }
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onVerified();
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperingReport = async () => {
    setIsVerifying(true);
    setError('');

    try {
      // Simulate report submission delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically:
      // 1. Log the tampering report to the blockchain
      // 2. Alert relevant authorities
      // 3. Update package status
      
      alert('Tampering report submitted successfully. Authorities have been notified.');
    } catch (err) {
      setError('Failed to submit tampering report. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Package Verification Required</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <QRCodeSVG
            value={qrData}
            size={200}
            level="H"
            includeMargin={true}
          />
          <p className="text-sm text-gray-600">
            Scan QR code or enter verification code
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full p-2 border rounded-md"
            maxLength={6}
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          onClick={handleVerification}
          disabled={isVerifying || verificationCode.length !== 6}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isVerifying || verificationCode.length !== 6
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isVerifying ? 'Verifying...' : 'Verify Package'}
        </button>

        <button
          onClick={handleTamperingReport}
          disabled={isVerifying}
          className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isVerifying ? 'Submitting Report...' : 'Report Tampering'}
        </button>

        {/* Debug section - remove in production */}
        <div className="mt-4 p-2 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-500">Debug Info:</p>
          <p className="text-xs font-mono">Code: {generatedCode}</p>
          <p className="text-xs font-mono">Package: {packageId}</p>
        </div>
      </div>
    </div>
  );
} 