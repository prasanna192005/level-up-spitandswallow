"use client";

import { useState, useEffect } from 'react';
import { EvaluationService } from '../../services/EvaluationService';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ResultReport from '../../components/ResultReport';

export default function StudentResultsPage() {
  const [studentId, setStudentId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!studentId.trim()) {
      setError('Please enter your student ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const allResults = await EvaluationService.getInstance().getResults();
      const studentResults = allResults.filter(result => 
        result.studentId === studentId && result.status === 'published'
      );
      
      if (studentResults.length === 0) {
        setError('No results found for this student ID');
      } else {
        setResults(studentResults);
      }
    } catch (err) {
      setError('Error fetching results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Check Your Results</h1>
        
        {/* Search Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your student ID"
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>

        {/* Results Display */}
        {results.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Student: {result.studentName}</p>
                      <p className="text-gray-600">ID: {result.studentId}</p>
                      <p className="text-gray-600">Subject: {result.subject}</p>
                      <p className="text-gray-600">Exam ID: {result.examId}</p>
                      <p className="text-gray-600">Marks: {result.marks}</p>
                      <p className="text-gray-600">Status: {result.status}</p>
                    </div>
                    <PDFDownloadLink
                      document={<ResultReport result={result} />}
                      fileName={`result_${result.studentId}_${result.examId}.pdf`}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
                    </PDFDownloadLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 