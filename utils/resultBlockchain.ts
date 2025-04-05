import { generateBlockchainHash } from './verification';

interface ResultData {
  studentId: string;
  examId: string;
  subjectResults: {
    subjectCode: string;
    marks: number;
    grade: string;
    evaluator: string;
    evaluationTimestamp: number;
  }[];
  totalMarks: number;
  percentage: number;
  finalGrade: string;
  status: 'DRAFT' | 'MODERATED' | 'PUBLISHED';
  evaluators: string[];
  moderator?: string;
  lastModified: number;
  encryptedData: string; // AES-256 encrypted sensitive data
}

interface ModeratorAction {
  moderatorId: string;
  timestamp: number;
  action: 'APPROVE' | 'REJECT' | 'MODIFY';
  comments: string;
  previousHash: string;
}

export class ResultBlock {
  public hash: string;

  constructor(
    public data: ResultData,
    public previousHash: string,
    public moderationHistory: ModeratorAction[] = []
  ) {
    this.hash = '';
  }

  async mine(): Promise<void> {
    this.hash = await generateBlockchainHash({
      data: this.data,
      previousHash: this.previousHash,
      moderationHistory: this.moderationHistory,
      timestamp: Date.now()
    });
  }
}

export class ResultBlockchain {
  private chain: ResultBlock[] = [];
  private static instance: ResultBlockchain;
  private encryptionKey: string; // AES-256 key for data encryption

  private constructor() {
    this.encryptionKey = process.env.RESULT_ENCRYPTION_KEY || 'default-secure-key';
    this.initializeChain();
  }

  static getInstance(): ResultBlockchain {
    if (!ResultBlockchain.instance) {
      ResultBlockchain.instance = new ResultBlockchain();
    }
    return ResultBlockchain.instance;
  }

  private async initializeChain() {
    const genesisBlock = new ResultBlock(
      {
        studentId: 'GENESIS',
        examId: 'GENESIS',
        subjectResults: [],
        totalMarks: 0,
        percentage: 0,
        finalGrade: 'NA',
        status: 'DRAFT',
        evaluators: ['SYSTEM'],
        lastModified: Date.now(),
        encryptedData: ''
      },
      '0'
    );
    await genesisBlock.mine();
    this.chain.push(genesisBlock);
    this.loadChain();
  }

  private loadChain() {
    try {
      const savedChain = localStorage.getItem('resultBlockchain');
      if (savedChain) {
        const parsedChain = JSON.parse(savedChain);
        if (Array.isArray(parsedChain) && parsedChain.length > 0) {
          this.chain = parsedChain.map(blockData => {
            const block = new ResultBlock(
              blockData.data,
              blockData.previousHash,
              blockData.moderationHistory
            );
            block.hash = blockData.hash;
            return block;
          });
        }
      }
    } catch (error) {
      console.error('Error loading result blockchain:', error);
    }
  }

  private saveChain() {
    try {
      localStorage.setItem('resultBlockchain', JSON.stringify(this.chain));
    } catch (error) {
      console.error('Error saving result blockchain:', error);
    }
  }

  // Add new result block
  async addResult(data: Omit<ResultData, 'encryptedData'>): Promise<string> {
    const encryptedData = await this.encryptSensitiveData(data);
    const previousBlock = this.chain[this.chain.length - 1];
    
    const newBlock = new ResultBlock(
      {
        ...data,
        encryptedData
      },
      previousBlock.hash
    );

    await newBlock.mine();
    this.chain.push(newBlock);
    this.saveChain();
    return newBlock.hash;
  }

  // Encrypt sensitive data
  private async encryptSensitiveData(data: any): Promise<string> {
    // In production, implement proper AES-256 encryption
    return btoa(JSON.stringify(data));
  }

  // Decrypt sensitive data
  private async decryptSensitiveData(encryptedData: string): Promise<any> {
    // In production, implement proper AES-256 decryption
    return JSON.parse(atob(encryptedData));
  }

  // Get result by student ID
  async getStudentResults(studentId: string): Promise<ResultBlock[]> {
    return this.chain.filter(block => block.data.studentId === studentId);
  }

  // Get result by exam ID
  async getExamResults(examId: string): Promise<ResultBlock[]> {
    return this.chain.filter(block => block.data.examId === examId);
  }

  // Add moderation action
  async addModeration(
    blockHash: string,
    moderatorAction: Omit<ModeratorAction, 'previousHash'>
  ): Promise<boolean> {
    const block = this.chain.find(b => b.hash === blockHash);
    if (!block) return false;

    block.moderationHistory.push({
      ...moderatorAction,
      previousHash: block.hash
    });

    await block.mine();
    this.saveChain();
    return true;
  }

  // Verify result integrity
  async verifyResult(blockHash: string): Promise<boolean> {
    const block = this.chain.find(b => b.hash === blockHash);
    if (!block) return false;

    const validHash = await generateBlockchainHash({
      data: block.data,
      previousHash: block.previousHash,
      moderationHistory: block.moderationHistory,
      timestamp: block.data.lastModified
    });

    return validHash === block.hash;
  }

  // Get result statistics
  getResultStats(examId: string) {
    const examResults = this.chain.filter(block => 
      block.data.examId === examId && 
      block.data.status === 'PUBLISHED'
    );

    if (examResults.length === 0) {
      return {
        totalStudents: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0
      };
    }

    const scores = examResults.map(result => result.data.totalMarks);
    const percentages = examResults.map(result => result.data.percentage);

    return {
      totalStudents: examResults.length,
      averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: (examResults.filter(r => r.data.finalGrade !== 'F').length / examResults.length) * 100
    };
  }
} 