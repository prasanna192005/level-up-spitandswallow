"use client";

import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { EvaluationService } from '../services/EvaluationService';
import { sampleStudents, SampleStudent } from '../utils/sampleData';
import dynamic from 'next/dynamic';

// Dynamically import PDF viewer with no SSR
const PDFViewer = dynamic(() => import('../components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
});

interface AnswerSheet {
  hashId: string;
  scanUrl: string;
  subject: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'evaluated';
  marks?: number;
  fileType: 'pdf' | 'image';
}

export default function BlindEvaluation({ isAdmin = false }) {
  const [answerSheets, setAnswerSheets] = useState<AnswerSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<AnswerSheet | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const evaluationService = EvaluationService.getInstance();

  useEffect(() => {
    setIsClient(true);
    // Initialize answer sheets with consistent hash generation
    const sheets: AnswerSheet[] = sampleStudents.map((student, index) => {
      const hashId = CryptoJS.SHA256(`${student.studentId}-${student.examId}-${student.timestamp}`).toString();
      return {
        hashId,
        scanUrl: `/sample-papers/answer_sheet_${index + 1}.pdf`,
        subject: student.subject,
        timestamp: student.timestamp,
        status: 'pending',
        fileType: 'pdf'
      };
    });
    setAnswerSheets(sheets);
  }, []);

  // Function to handle evaluation submission
  const handleEvaluationSubmit = async (marks: number) => {
    if (!selectedSheet) return;

    try {
      console.log('Starting evaluation submission...');
      console.log('Selected sheet:', selectedSheet);
      
      // Find the student details from the hash ID
      const student = sampleStudents.find(s => {
        const hash = CryptoJS.SHA256(`${s.studentId}-${s.examId}-${s.timestamp}`).toString();
        console.log('Comparing hashes:', { 
          computed: hash, 
          stored: selectedSheet.hashId,
          studentId: s.studentId,
          examId: s.examId,
          timestamp: s.timestamp
        });
        return hash === selectedSheet.hashId;
      });

      console.log('Found student:', student);

      if (!student) {
        throw new Error('Student details not found for this answer sheet');
      }

      // Store evaluation result
      const evaluationResult = {
        hashId: selectedSheet.hashId,
        marks,
        evaluatorId: 'EVAL001',
        timestamp: new Date().toISOString(),
        comments: 'Evaluation completed'
      };
      console.log('Storing evaluation result:', evaluationResult);
      await evaluationService.storeEvaluationResult(evaluationResult);

      // Store result for publishing
      const result = {
        hashId: selectedSheet.hashId,
        marks,
        subject: selectedSheet.subject,
        timestamp: new Date().toISOString(),
        status: 'pending_publication',
        evaluatorId: 'EVAL001',
        moderationStatus: 'pending',
        studentId: student.studentId,
        studentName: student.studentName,
        examId: student.examId
      };

      console.log('Storing result for publishing:', result);
      await evaluationService.storeResult(result);

      // Update the answer sheet status
      const updatedSheets = answerSheets.map(sheet => 
        sheet.hashId === selectedSheet.hashId 
          ? { ...sheet, status: 'evaluated', marks }
          : sheet
      );
      setAnswerSheets(updatedSheets);
      setSelectedSheet(null);

      alert('Evaluation submitted successfully! Results are ready for publishing.');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Failed to submit evaluation. Please try again.');
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
      {/* Answer Sheets for Evaluation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Papers for Evaluation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {answerSheets.map(sheet => (
            <div 
              key={sheet.hashId}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedSheet(sheet)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">Hash ID: {sheet.hashId.slice(0, 8)}...</p>
                  <p className="text-sm text-gray-500">Subject: {sheet.subject}</p>
                  <p className="text-sm text-gray-500">Status: {sheet.status}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sheet.status === 'evaluated' ? 'bg-green-100 text-green-800' :
                  sheet.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sheet.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Interface */}
      {selectedSheet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Evaluate Answer Sheet</h3>
              <button 
                onClick={() => setSelectedSheet(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Answer Sheet Display */}
            <div className="mb-4 border rounded p-4">
              <PDFViewer 
                file={selectedSheet.scanUrl}
                onError={(error) => {
                  console.error('Error loading PDF:', error);
                  setPdfError('Failed to load PDF. Please try again.');
                }}
              />
            </div>

            {/* Marking Interface */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marks</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => {
                    const marks = parseInt(e.target.value);
                    setSelectedSheet(prev => prev ? {...prev, marks} : null);
                  }}
                  value={selectedSheet.marks || ''}
                />
              </div>
              
              <button
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                onClick={() => {
                  if (selectedSheet.marks !== undefined) {
                    handleEvaluationSubmit(selectedSheet.marks);
                  }
                }}
              >
                Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 