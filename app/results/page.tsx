"use client";

import { useState } from 'react';
import BlindEvaluation from '../../components/BlindEvaluation';
import Link from 'next/link';

export default function ResultsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Secure Evaluation System</h1>
        <div className="flex gap-4">
          <Link 
            href="/results/publishing"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Result Publishing
          </Link>
          <Link 
            href="/student-results"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Check Student Results
          </Link>
        </div>
      </div>
      
      <BlindEvaluation isAdmin={true} />
    </div>
  );
} 