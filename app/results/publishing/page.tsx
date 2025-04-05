"use client";

import { useState, useEffect } from 'react';
import ResultPublishing from '../../../components/ResultPublishing';
import Link from 'next/link';

export default function PublishingPage() {
  const [studentId, setStudentId] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchId, setSearchId] = useState('');

  // Reset showResults when studentId changes
  useEffect(() => {
    setShowResults(false);
  }, [studentId]);

  const handleCheck = () => {
    if (studentId.trim()) {
      // Convert S001 format to 2024CS001 format
      const convertedId = studentId.startsWith('S') 
        ? `2024CS${studentId.slice(1)}` 
        : studentId;
      setSearchId(convertedId);
      setShowResults(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Result Publishing</h1>
        <div className="flex gap-4">
          <Link 
            href="/results"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Evaluation
          </Link>
        </div>
      </div>

      {/* Check Results Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Check Results</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter student ID to check results (e.g., S001 or 2024CS001)"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCheck}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Check
          </button>
        </div>
      </div>

      {/* Results Display */}
      {showResults && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Results for Student ID: {studentId}</h2>
          <ResultPublishing studentId={searchId} />
        </div>
      )}

      {/* All Results Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">All Results for Publishing</h2>
        <ResultPublishing />
      </div>
    </div>
  );
} 