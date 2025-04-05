import { ResultBlockchain } from '../utils/resultBlockchain';

interface GradeRange {
  min: number;
  max: number;
  grade: string;
}

interface SubjectResult {
  subjectCode: string;
  marks: number;
  totalMarks: number;
  answers: Answer[];
}

interface Answer {
  questionId: string;
  response: string;
  marks: number;
  feedback?: string;
}

export class ResultProcessingService {
  private static instance: ResultProcessingService;
  private blockchain: ResultBlockchain;
  
  // Grade ranges for automatic grading
  private gradeRanges: GradeRange[] = [
    { min: 90, max: 100, grade: 'A+' },
    { min: 80, max: 89, grade: 'A' },
    { min: 70, max: 79, grade: 'B+' },
    { min: 60, max: 69, grade: 'B' },
    { min: 50, max: 59, grade: 'C' },
    { min: 40, max: 49, grade: 'D' },
    { min: 0, max: 39, grade: 'F' }
  ];

  private constructor() {
    this.blockchain = ResultBlockchain.getInstance();
  }

  static getInstance(): ResultProcessingService {
    if (!ResultProcessingService.instance) {
      ResultProcessingService.instance = new ResultProcessingService();
    }
    return ResultProcessingService.instance;
  }

  // Process a single subject result
  async processSubjectResult(
    studentId: string,
    examId: string,
    subjectResult: SubjectResult,
    evaluatorId: string
  ): Promise<string> {
    const totalMarks = subjectResult.marks;
    const percentage = (totalMarks / subjectResult.totalMarks) * 100;
    const grade = this.calculateGrade(percentage);

    // Create result data
    const resultData = {
      studentId,
      examId,
      subjectResults: [{
        subjectCode: subjectResult.subjectCode,
        marks: totalMarks,
        grade,
        evaluator: evaluatorId,
        evaluationTimestamp: Date.now()
      }],
      totalMarks,
      percentage,
      finalGrade: grade,
      status: 'PUBLISHED' as const, // Changed from DRAFT to PUBLISHED for demo
      evaluators: [evaluatorId],
      lastModified: Date.now()
    };

    // Add to blockchain
    return await this.blockchain.addResult(resultData);
  }

  // Calculate grade based on percentage
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  // Moderate a result
  async moderateResult(
    blockHash: string,
    moderatorId: string,
    action: 'APPROVE' | 'REJECT' | 'MODIFY',
    comments: string
  ): Promise<boolean> {
    return await this.blockchain.addModeration(blockHash, {
      moderatorId,
      timestamp: Date.now(),
      action,
      comments
    });
  }

  // Get student results
  async getStudentResults(studentId: string) {
    return await this.blockchain.getStudentResults(studentId);
  }

  // Get exam statistics
  async getExamStats(examId: string) {
    const results = await this.blockchain.getExamResults(examId);
    
    if (results.length === 0) {
      return {
        totalStudents: 0,
        averagePercentage: 0,
        highestScore: 0,
        passRate: 0
      };
    }

    const totalStudents = results.length;
    const totalMarks = results.map(r => r.data.totalMarks);
    const percentages = results.map(r => r.data.percentage);
    const passingResults = results.filter(r => r.data.finalGrade !== 'F').length;

    return {
      totalStudents,
      averagePercentage: percentages.reduce((a, b) => a + b, 0) / totalStudents,
      highestScore: Math.max(...totalMarks),
      passRate: (passingResults / totalStudents) * 100
    };
  }

  // Detect anomalies in results
  async detectAnomalies(examId: string) {
    const results = await this.blockchain.getExamResults(examId);
    
    // If no results, return empty array
    if (results.length === 0) {
      return [];
    }
    
    const marks = results.map(r => r.data.totalMarks);
    
    // Calculate mean and standard deviation with initial values
    const mean = marks.reduce((a, b) => a + b, 0) / marks.length;
    const stdDev = Math.sqrt(
      marks.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / marks.length
    );

    // Flag results that deviate significantly
    return results.filter(result => 
      Math.abs(result.data.totalMarks - mean) > 2 * stdDev
    );
  }

  // Verify result integrity
  async verifyResultIntegrity(blockHash: string): Promise<boolean> {
    return await this.blockchain.verifyResult(blockHash);
  }

  // Generate sample results for testing
  async generateSampleResults(examId: string) {
    const students = [
      { id: 'STU001', name: 'Aakash Patel' },
      { id: 'STU002', name: 'Prasanna Kumar' },
      { id: 'STU003', name: 'Lokesh Sharma' },
      { id: 'STU004', name: 'Daksh Malhotra' },
      { id: 'STU005', name: 'Krrish Verma' },
      { id: 'STU006', name: 'Riya Singh' },
      { id: 'STU007', name: 'Arjun Reddy' },
      { id: 'STU008', name: 'Priya Gupta' },
      { id: 'STU009', name: 'Rahul Mehta' },
      { id: 'STU010', name: 'Ananya Desai' }
    ];

    const subjects = [
      { code: 'MAT101', name: 'Mathematics', totalMarks: 100 },
      { code: 'PHY101', name: 'Physics', totalMarks: 100 },
      { code: 'CHE101', name: 'Chemistry', totalMarks: 100 }
    ];

    const evaluators = [
      { id: 'EVAL001', name: 'Dr. Rajesh Kumar' },
      { id: 'EVAL002', name: 'Dr. Meera Iyer' },
      { id: 'EVAL003', name: 'Prof. Suresh Menon' }
    ];

    // Generate results for each student
    for (const student of students) {
      let totalStudentMarks = 0;
      const studentSubjectResults = [];

      // Generate marks for each subject
      for (const subject of subjects) {
        // Generate realistic marks with some variation
        const marks = Math.floor(35 + Math.random() * 65); // Marks between 35 and 100
        totalStudentMarks += marks;
        
        const evaluator = evaluators[Math.floor(Math.random() * evaluators.length)];
        
        studentSubjectResults.push({
          subjectCode: subject.code,
          marks: marks,
          totalMarks: subject.totalMarks,
          grade: this.calculateGrade((marks / subject.totalMarks) * 100),
          evaluator: evaluator.id,
          evaluationTimestamp: Date.now()
        });
      }

      // Calculate overall percentage and grade
      const totalPossibleMarks = subjects.length * 100;
      const overallPercentage = (totalStudentMarks / totalPossibleMarks) * 100;
      const finalGrade = this.calculateGrade(overallPercentage);

      // Create and add the result to blockchain
      await this.blockchain.addResult({
        studentId: student.id,
        examId,
        subjectResults: studentSubjectResults,
        totalMarks: totalStudentMarks,
        percentage: overallPercentage,
        finalGrade,
        status: 'PUBLISHED',
        evaluators: studentSubjectResults.map(sr => sr.evaluator),
        lastModified: Date.now()
      });
    }

    return students.length; // Return total number of results generated
  }

  // Get detailed exam results with student names
  async getDetailedExamResults(examId: string) {
    const results = await this.blockchain.getExamResults(examId);
    return results.map(result => ({
      ...result,
      studentName: this.getStudentName(result.data.studentId), // You would typically get this from a database
      subjectDetails: result.data.subjectResults.map(sr => ({
        ...sr,
        subjectName: this.getSubjectName(sr.subjectCode) // You would typically get this from a database
      }))
    }));
  }

  // Helper method to get student name (mock implementation)
  private getStudentName(studentId: string): string {
    const studentMap = {
      'STU001': 'Aakash Patel',
      'STU002': 'Prasanna Kumar',
      'STU003': 'Lokesh Sharma',
      'STU004': 'Daksh Malhotra',
      'STU005': 'Krrish Verma',
      'STU006': 'Riya Singh',
      'STU007': 'Arjun Reddy',
      'STU008': 'Priya Gupta',
      'STU009': 'Rahul Mehta',
      'STU010': 'Ananya Desai'
    };
    return studentMap[studentId] || studentId;
  }

  // Helper method to get subject name (mock implementation)
  private getSubjectName(subjectCode: string): string {
    const subjectMap = {
      'MAT101': 'Mathematics',
      'PHY101': 'Physics',
      'CHE101': 'Chemistry'
    };
    return subjectMap[subjectCode] || subjectCode;
  }
} 