"use client";

import { QRCodeSVG } from 'qrcode.react';

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
  examId: string;
}

interface ResultQRProps {
  result: Result;
}

export default function ResultQR({ result }: ResultQRProps) {
  const qrData = JSON.stringify({
    studentId: result.studentId,
    examId: result.examId,
    subject: result.subject,
    marks: result.marks,
    timestamp: result.timestamp,
    hashId: result.hashId
  });

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Result Verification QR</h3>
      <QRCodeSVG
        value={qrData}
        size={200}
        level="H"
        includeMargin={true}
      />
      <p className="text-sm text-gray-600">
        Scan to verify result authenticity
      </p>
    </div>
  );
} 