declare global {
  interface Window {
    ethereum?: any;
  }
}

"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DeliveryStatus, PackageData } from '../types/delivery';

const SMART_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS || '';

const BlockchainDelivery: React.FC<{
  packageId: string;
  onStatusUpdate: (status: DeliveryStatus) => void;
}> = ({ packageId, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus | null>(null);

  // Initialize blockchain connection
  const connectBlockchain = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask to use this feature');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // TODO: Add contract ABI and instantiate contract
      // const contract = new ethers.Contract(SMART_CONTRACT_ADDRESS, ABI, signer);
      
      return { provider, signer };
    } catch (err) {
      setError('Failed to connect to blockchain: ' + (err as Error).message);
      return null;
    }
  };

  // Update delivery status on blockchain
  const updateDeliveryStatus = async (newStatus: DeliveryStatus['status']) => {
    setLoading(true);
    try {
      const connection = await connectBlockchain();
      if (!connection) return;

      // TODO: Call smart contract method to update status
      // await contract.updateDeliveryStatus(packageId, newStatus);

      const updatedStatus: DeliveryStatus = {
        packageId,
        status: newStatus,
        timestamp: Date.now(),
        location: [0, 0], // TODO: Get current location
        signatures: [],
        verifications: []
      };

      setCurrentStatus(updatedStatus);
      onStatusUpdate(updatedStatus);
    } catch (err) {
      setError('Failed to update status: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Verify package integrity
  const verifyPackage = async () => {
    setLoading(true);
    try {
      const connection = await connectBlockchain();
      if (!connection) return;

      // TODO: Call smart contract method to verify package
      // const verification = await contract.verifyPackage(packageId);

      if (currentStatus) {
        const updatedStatus: DeliveryStatus = {
          ...currentStatus,
          status: 'VERIFIED',
          verifications: [
            ...currentStatus.verifications,
            {
              verifier: connection.signer.address,
              timestamp: Date.now()
            }
          ]
        };
        setCurrentStatus(updatedStatus);
        onStatusUpdate(updatedStatus);
      }
    } catch (err) {
      setError('Failed to verify package: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Blockchain Delivery Status</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {currentStatus && (
        <div className="mb-4">
          <p className="font-medium">Current Status: {currentStatus.status}</p>
          <p>Last Updated: {new Date(currentStatus.timestamp).toLocaleString()}</p>
          <p>Verifications: {currentStatus.verifications.length}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => updateDeliveryStatus('IN_TRANSIT')}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Start Delivery
        </button>
        
        <button
          onClick={() => updateDeliveryStatus('DELIVERED')}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Confirm Delivery
        </button>
        
        <button
          onClick={verifyPackage}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Verify Package
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-gray-600">
          Processing blockchain transaction...
        </div>
      )}
    </div>
  );
};

export default BlockchainDelivery; 