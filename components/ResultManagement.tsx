"use client";

import { useState, useEffect } from 'react';
import { ResultProcessingService } from '../services/ResultProcessingService';
import { ResultBlock } from '../utils/resultBlockchain';
import ResultAnalytics from './ResultAnalytics';

interface ResultDisplayProps {
  examId?: string;
  studentId?: string;
  isAdmin?: boolean;
}

export default function ResultManagement({ examId, studentId, isAdmin = false }: ResultDisplayProps) {
  const [results, setResults] = useState<ResultBlock[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<ResultBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState<ResultBlock | null>(null);
  const [moderationComment, setModerationComment] = useState('');

  const resultService = ResultProcessingService.getInstance();

  useEffect(() => {
    loadResults();
  }, [examId, studentId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      let fetchedResults: ResultBlock[] = [];
      
      if (studentId) {
        fetchedResults = await resultService.getStudentResults(studentId);
      } else if (examId) {
        // Generate sample results if none exist
        const currentResults = await resultService.getDetailedExamResults(examId);
        if (currentResults.length === 0) {
          console.log('Generating sample results...');
          await resultService.generateSampleResults(examId);
          // Wait a moment for blockchain to update
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Get detailed results with student names
        fetchedResults = await resultService.getDetailedExamResults(examId);
        
        // Get exam statistics after ensuring we have data
        const examStats = await resultService.getExamStats(examId);
        console.log('Exam stats:', examStats);
        setStats(examStats);
        
        if (isAdmin) {
          const anomalyResults = await resultService.detectAnomalies(examId);
          setAnomalies(anomalyResults);
        }
      }
      
      setResults(fetchedResults);
      console.log('Fetched results:', fetchedResults);
    } catch (err) {
      setError('Failed to load results');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (action: 'APPROVE' | 'REJECT' | 'MODIFY') => {
    if (!selectedResult) return;

    try {
      await resultService.moderateResult(
        selectedResult.hash,
        'MODERATOR_ID', // In production, use actual moderator ID
        action,
        moderationComment
      );
      
      setSelectedResult(null);
      setModerationComment('');
      loadResults();
    } catch (err) {
      setError('Moderation failed');
      console.error(err);
    }
  };

  const getStatusColor = (result: ResultBlock) => {
    if (!result.moderationHistory || result.moderationHistory.length === 0) {
      return 'bg-white';
    }
    const lastModeration = result.moderationHistory[result.moderationHistory.length - 1];
    switch (lastModeration.action) {
      case 'APPROVE':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'REJECT':
        return 'bg-red-50 border-l-4 border-red-400';
      case 'MODIFY':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      default:
        return 'bg-white';
    }
  };

  const getStatusIcon = (result: ResultBlock) => {
    if (!result.moderationHistory || result.moderationHistory.length === 0) {
      return null;
    }
    const lastModeration = result.moderationHistory[result.moderationHistory.length - 1];
    switch (lastModeration.action) {
      case 'APPROVE':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'REJECT':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'MODIFY':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-blue-600 font-semibold">Total Students</h3>
            <p className="text-2xl font-bold">{stats.totalStudents || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-green-600 font-semibold">Average Score</h3>
            <p className="text-2xl font-bold">
              {stats.averagePercentage ? `${stats.averagePercentage.toFixed(1)}%` : '0%'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-purple-600 font-semibold">Highest Score</h3>
            <p className="text-2xl font-bold">{stats.highestScore || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-yellow-600 font-semibold">Pass Rate</h3>
            <p className="text-2xl font-bold">
              {stats.passRate ? `${stats.passRate.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {results.length > 0 && !studentId && (
        <div className="mb-8">
          <ResultAnalytics results={results} />
        </div>
      )}

      {/* Results List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {studentId ? 'Student Results' : 'Exam Results'}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {results.map((result) => (
              <li
                key={result.hash}
                className={`px-4 py-4 hover:bg-opacity-75 cursor-pointer transition-colors duration-150 ${getStatusColor(result)}`}
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {result.studentName?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {result.studentName || result.data.studentId}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {result.data.studentId}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      {result.data.subjectResults.map(subject => (
                        <div key={subject.subjectCode} className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {subject.subjectCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            {subject.marks}/{100}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Total: {result.data.totalMarks}
                      </p>
                      <p className="text-sm text-gray-500">
                        Grade: {result.data.finalGrade}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(result.data.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusIcon(result)}
                  </div>
                </div>
                {result.moderationHistory && result.moderationHistory.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className={`
                      ${result.moderationHistory[result.moderationHistory.length - 1].action === 'APPROVE' ? 'text-green-600' : ''}
                      ${result.moderationHistory[result.moderationHistory.length - 1].action === 'REJECT' ? 'text-red-600' : ''}
                      ${result.moderationHistory[result.moderationHistory.length - 1].action === 'MODIFY' ? 'text-yellow-600' : ''}
                    `}>
                      Last moderation: {result.moderationHistory[result.moderationHistory.length - 1].comments}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Moderation Panel */}
      {isAdmin && selectedResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Result Moderation</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Comments
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={moderationComment}
                onChange={(e) => setModerationComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleModeration('APPROVE')}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => handleModeration('REJECT')}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Reject
              </button>
              <button
                onClick={() => handleModeration('MODIFY')}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Request Modification
              </button>
              <button
                onClick={() => setSelectedResult(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies Section */}
      {isAdmin && anomalies.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-red-600 mb-4">
            Detected Anomalies
          </h3>
          <div className="bg-red-50 rounded-lg p-4">
            <ul className="divide-y divide-red-200">
              {anomalies.map((anomaly) => (
                <li key={anomaly.hash} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Student ID: {anomaly.data.studentId}
                      </p>
                      <p className="text-sm text-red-600">
                        Marks: {anomaly.data.totalMarks}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedResult(anomaly)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Review
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 