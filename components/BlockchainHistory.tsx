"use client";

import { useState, useEffect } from 'react';
import { ExamBlockchain } from '../utils/blockchain';
import { getBlockchainStats, getVerificationHistory } from '../utils/verification';

export default function BlockchainHistory() {
  const [stats, setStats] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [packageHistory, setPackageHistory] = useState<any[]>([]);
  const [packages, setPackages] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateData = () => {
      try {
        const blockchain = ExamBlockchain.getInstance();
        const currentStats = getBlockchainStats();
        setStats(currentStats);
        setLastUpdate(new Date());

        // Get unique package IDs from blockchain
        const allBlocks = blockchain.chain;
        const uniquePackages = Array.from(new Set(
          allBlocks
            .filter(block => block.data?.packageId && block.data.packageId !== 'GENESIS')
            .map(block => block.data.packageId)
        ));
        setPackages(uniquePackages);

        // Update history for selected package
        if (selectedPackage) {
          const history = blockchain.getPackageHistory(selectedPackage);
          setPackageHistory(history);
        }
      } catch (error) {
        console.error('Error updating blockchain data:', error);
      }
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedPackage]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SEAL': return 'text-green-600 bg-green-50';
      case 'CHECKPOINT': return 'text-blue-600 bg-blue-50';
      case 'DELIVERY': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SEAL':
        return '🔒';
      case 'CHECKPOINT':
        return '🔍';
      case 'DELIVERY':
        return '✅';
      default:
        return '📦';
    }
  };

  const formatLocation = (location: [number, number]) => {
    return `[${location[0].toFixed(4)}, ${location[1].toFixed(4)}]`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Blockchain Verification</h3>
          <p className="text-xs text-gray-500">Package verification history</p>
        </div>
        <span className="text-xs text-gray-500">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {/* Stats and Package Selection */}
      <div className="p-3 border-b bg-white">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-xs text-blue-600">Total Blocks</div>
            <div className="text-lg font-bold text-blue-700">{stats?.totalBlocks || 0}</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-xs text-green-600">Active Packages</div>
            <div className="text-lg font-bold text-green-700">{packages.length}</div>
          </div>
        </div>

        <select
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className="w-full text-sm p-2 border rounded bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select package to view history...</option>
          {packages.map((packageId) => (
            <option key={packageId} value={packageId}>{packageId}</option>
          ))}
        </select>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-3">
        {packageHistory.length > 0 ? (
          <div className="space-y-2">
            {packageHistory.map((block, index) => (
              <div key={block.hash} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-none rounded-full w-8 h-8 flex items-center justify-center ${getActionColor(block.data.action)}`}>
                      <span className="text-lg">{getActionIcon(block.data.action)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{block.data.action}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(block.data.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Location: {formatLocation(block.data.location)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-600">{block.data.verifier?.id}</div>
                    <div className="text-xs font-mono text-gray-400 mt-1">
                      {block.hash.slice(0, 6)}
                    </div>
                  </div>
                </div>

                {block.data.evidence && block.data.evidence.sealCondition && (
                  <div className="mt-2 flex items-center text-xs text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Seal intact
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📦</div>
            <p className="text-sm text-gray-500">
              {selectedPackage 
                ? 'No verification history available for this package' 
                : 'Select a package to view its verification history'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 