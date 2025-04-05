"use client";

import { useState, useEffect } from 'react';
import { EvaluationService } from '../services/EvaluationService';
import { sampleStudents } from '../utils/sampleData';
import CryptoJS from 'crypto-js';
import ResultQR from './ResultQR';

interface Result {
  hashId: string;
  marks: number;
  subject: string;
  timestamp: string;
  status: 'pending_publication' | 'published' | 'rejected';
  evaluatorId: string;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'modified';
  moderationComments?: string;
  studentId: string;
  studentName: string;
  examId: string;
}

interface ResultPublishingProps {
  studentId?: string;
}

export default function ResultPublishing({ studentId }: ResultPublishingProps) {
  const [isClient, setIsClient] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'modify'>('approve');
  const [moderationComments, setModerationComments] = useState('');
  const evaluationService = EvaluationService.getInstance();

  const getStudentName = (studentId: string) => {
    const student = sampleStudents.find(s => s.studentId === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const loadResults = async () => {
    try {
      console.log('Loading results for studentId:', studentId);
      const storedResults = await evaluationService.getResults();
      console.log('All stored results:', storedResults);
      
      // Filter results if studentId is provided
      const filteredResults = studentId 
        ? storedResults.filter(result => {
            console.log('Checking result:', {
              inputId: studentId,
              resultId: result.studentId,
              matches: result.studentId === studentId
            });
            return result.studentId === studentId;
          })
        : storedResults;
      
      console.log('Filtered results:', filteredResults);
      setResults(filteredResults);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  useEffect(() => {
    console.log('Component mounted with studentId:', studentId);
    setIsClient(true);
    loadResults();
    
    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage changed, reloading results');
      if (e.key === 'results') {
        loadResults();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom storage events
    const handleCustomStorage = () => {
      console.log('Custom storage event, reloading results');
      loadResults();
    };
    
    window.addEventListener('custom-storage', handleCustomStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('custom-storage', handleCustomStorage);
    };
  }, [studentId]); // Add studentId as dependency

  const handlePublish = async () => {
    if (!selectedResult) return;

    try {
      const updatedResult: Result = {
        ...selectedResult,
        status: 'published' as const,
        timestamp: new Date().toISOString(),
        studentName: getStudentName(selectedResult.studentId)
      };

      await evaluationService.storeResult(updatedResult);

      setResults(prevResults =>
        prevResults.map(result =>
          result.hashId === selectedResult.hashId ? updatedResult : result
        )
      );

      setShowPublishModal(false);
      setSelectedResult(null);
      alert('Results published successfully!');
    } catch (error) {
      console.error('Error publishing results:', error);
      alert('Failed to publish results. Please try again.');
    }
  };

  const handleModeration = async () => {
    if (!selectedResult) return;

    try {
      const updatedResult: Result = {
        ...selectedResult,
        moderationStatus: moderationAction === 'approve' ? 'approved' as const :
                         moderationAction === 'reject' ? 'rejected' as const : 'modified' as const,
        moderationComments,
        timestamp: new Date().toISOString(),
        studentName: getStudentName(selectedResult.studentId)
      };

      await evaluationService.storeModeration({
        hashId: selectedResult.hashId,
        action: moderationAction,
        comments: moderationComments,
        timestamp: new Date().toISOString(),
        moderatorId: 'MOD001'
      });

      await evaluationService.storeResult(updatedResult);

      setResults(prevResults =>
        prevResults.map(result =>
          result.hashId === selectedResult.hashId ? updatedResult : result
        )
      );

      setShowModerationModal(false);
      setSelectedResult(null);
      setModerationComments('');
      alert('Moderation completed successfully!');
    } catch (error) {
      console.error('Error during moderation:', error);
      alert('Failed to complete moderation. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'rejected':
        return 'bg-red-50 border-l-4 border-red-400';
      case 'pending_publication':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      default:
        return 'bg-white';
    }
  };

  const getModerationColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'modified':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Results for Publication</h3>
        
        {/* Results List */}
        <div className="space-y-4">
          {results.map(result => (
            <div
              key={result.hashId}
              className={`p-4 rounded-lg ${getStatusColor(result.status)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Student ID: {result.studentId}
                    </p>
                    <p className="text-sm text-gray-500">Subject: {result.subject}</p>
                    <p className="text-sm text-gray-500">Exam ID: {result.examId}</p>
                    <p className="text-sm text-gray-500">Marks: {result.marks}</p>
                    <p className="text-sm text-gray-500">
                      Status: <span className={getModerationColor(result.moderationStatus)}>
                        {result.moderationStatus}
                      </span>
                    </p>
                  </div>
                  <div className="ml-4">
                    <ResultQR result={result} />
                  </div>
                </div>
                <div className="flex space-x-2">
                  {result.status === 'pending_publication' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setShowModerationModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Moderate
                      </button>
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setShowPublishModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Publish
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && selectedResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Publish Results</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to publish these results? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirm Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {showModerationModal && selectedResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Moderate Results</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <select
                  value={moderationAction}
                  onChange={(e) => setModerationAction(e.target.value as 'approve' | 'reject' | 'modify')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="modify">Request Modification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comments</label>
                <textarea
                  value={moderationComments}
                  onChange={(e) => setModerationComments(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModeration}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Moderation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 