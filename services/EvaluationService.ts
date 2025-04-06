import { SHA256 } from 'crypto-js';

interface StudentMapping {
  hashId: string;
  studentId: string;
  studentName: string;
  examId: string;
}

interface EvaluationResult {
  hashId: string;
  marks: number;
  evaluatorId: string;
  timestamp: string;
  comments?: string;
}

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

export class EvaluationService {
  private static instance: EvaluationService;
  private studentMappings: Map<string, StudentMapping>;
  private evaluationResults: Map<string, EvaluationResult>;

  private constructor() {
    this.studentMappings = new Map();
    this.evaluationResults = new Map();
    // Initialize localStorage if not exists
    if (typeof window !== 'undefined' && !localStorage.getItem('results')) {
      localStorage.setItem('results', JSON.stringify([]));
    }
  }

  public static getInstance(): EvaluationService {
    if (!EvaluationService.instance) {
      EvaluationService.instance = new EvaluationService();
    }
    return EvaluationService.instance;
  }

  // Store student mapping securely (admin only)
  public async storeStudentMapping(mapping: StudentMapping): Promise<void> {
    // In production, this would be encrypted and stored in a secure database
    this.studentMappings.set(mapping.hashId, mapping);
  }

  // Store evaluation result
  public async storeEvaluationResult(result: EvaluationResult): Promise<void> {
    try {
      this.evaluationResults.set(result.hashId, result);
    } catch (error) {
      console.error('Error storing evaluation result:', error);
      throw error;
    }
  }

  // Get evaluation result by hash (evaluator access)
  public async getEvaluationResult(hashId: string): Promise<EvaluationResult | null> {
    return this.evaluationResults.get(hashId) || null;
  }

  // Get student details by hash (admin only)
  public async getStudentMapping(hashId: string): Promise<StudentMapping | null> {
    return this.studentMappings.get(hashId) || null;
  }

  // Generate final result (admin only)
  public async generateFinalResult(hashId: string): Promise<{
    studentDetails: StudentMapping | null;
    evaluationResult: EvaluationResult | null;
  }> {
    const studentMapping = await this.getStudentMapping(hashId);
    const evaluationResult = await this.getEvaluationResult(hashId);

    return {
      studentDetails: studentMapping,
      evaluationResult
    };
  }

  // Verify hash integrity
  public verifyHash(studentId: string, examId: string, timestamp: string, hashId: string): boolean {
    const computedHash = SHA256(`${studentId}-${examId}-${timestamp}`).toString();
    return computedHash === hashId;
  }

  // Get all pending evaluations
  public async getPendingEvaluations(): Promise<string[]> {
    const pending: string[] = [];
    this.evaluationResults.forEach((result, hashId) => {
      if (!result.marks) {
        pending.push(hashId);
      }
    });
    return pending;
  }

  async getResults(): Promise<Result[]> {
    try {
      if (typeof window === 'undefined') return [];
      const results = localStorage.getItem('results');
      console.log('Retrieved results from localStorage:', results);
      return results ? JSON.parse(results) : [];
    } catch (error) {
      console.error('Error getting results:', error);
      return [];
    }
  }

  async storeResult(result: Result): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      console.log('Storing result:', result);
      const existingResults = await this.getResults();
      const updatedResults = existingResults.filter(r => r.hashId !== result.hashId);
      updatedResults.push(result);
      console.log('Updated results array:', updatedResults);
      localStorage.setItem('results', JSON.stringify(updatedResults));
      // Dispatch storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'results',
        newValue: JSON.stringify(updatedResults),
        oldValue: JSON.stringify(existingResults),
        storageArea: localStorage
      }));
      // Also dispatch custom event
      window.dispatchEvent(new CustomEvent('custom-storage'));
    } catch (error) {
      console.error('Error storing result:', error);
      throw error;
    }
  }

  async storeModeration(moderation: {
    hashId: string;
    action: 'approve' | 'reject' | 'modify';
    comments: string;
    timestamp: string;
    moderatorId: string;
  }): Promise<void> {
    try {
      console.log('Storing moderation:', moderation);
      const results = await this.getResults();
      const result = results.find(r => r.hashId === moderation.hashId);
      if (result) {
        result.moderationStatus = moderation.action === 'approve' ? 'approved' :
                                moderation.action === 'reject' ? 'rejected' : 'modified';
        result.moderationComments = moderation.comments;
        await this.storeResult(result);
      }
    } catch (error) {
      console.error('Error storing moderation:', error);
      throw error;
    }
  }
} 