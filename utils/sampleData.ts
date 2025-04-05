import { SHA256 } from 'crypto-js';

export interface SampleStudent {
  studentId: string;
  name: string;
  examId: string;
  subject: string;
  answerSheet?: File;  // This will store the uploaded file
}

// Sample student data without answer sheets
export const sampleStudents: SampleStudent[] = [
  {
    studentId: "2024CS001",
    name: "Rahul Kumar",
    examId: "CS301_2024",
    subject: "Data Structures"
  },
  {
    studentId: "2024CS002",
    name: "Priya Sharma",
    examId: "CS301_2024",
    subject: "Data Structures"
  },
  {
    studentId: "2024CS003",
    name: "Amit Patel",
    examId: "CS301_2024",
    subject: "Data Structures"
  },
  {
    studentId: "2024CS004",
    name: "Sneha Gupta",
    examId: "CS301_2024",
    subject: "Data Structures"
  },
  {
    studentId: "2024CS005",
    name: "Raj Singh",
    examId: "CS301_2024",
    subject: "Data Structures"
  }
];

// Function to attach answer sheets to students
export const attachAnswerSheets = (files: File[]) => {
  return sampleStudents.map((student, index) => {
    if (index < files.length) {
      return {
        ...student,
        answerSheet: files[index]
      };
    }
    return student;
  });
};

// Generate hash IDs for students with answer sheets
export const generateSampleMappings = (studentsWithSheets: SampleStudent[]) => {
  return studentsWithSheets.map(student => {
    const timestamp = new Date().toISOString();
    const hashId = SHA256(`${student.studentId}-${student.examId}-${timestamp}`).toString();
    
    return {
      hashId,
      studentId: student.studentId,
      studentName: student.name,
      examId: student.examId,
      subject: student.subject,
      timestamp,
      answerSheet: student.answerSheet
    };
  });
}; 