import { generateBlockchainHash } from './verification';

interface BlockData {
  packageId: string;
  timestamp: number;
  location: [number, number];
  action: 'SEAL' | 'CHECKPOINT' | 'DELIVERY';
  verifier: {
    id: string;
    role: string;
  };
  evidence: {
    sealCondition: boolean;
    photoHash?: string;
    qrData: string;
  };
  previousHash: string;
}

export class Block {
  public hash: string;

  constructor(
    public data: BlockData,
    public previousHash: string
  ) {
    this.hash = ''; // Will be set when the block is mined
  }

  async mine(): Promise<void> {
    // Simple mining implementation
    this.hash = await generateBlockchainHash({
      data: this.data,
      previousHash: this.previousHash,
      timestamp: Date.now()
    });
  }
}

export class ExamBlockchain {
  private chain: Block[] = [];
  private static instance: ExamBlockchain;

  private constructor() {
    // Initialize with genesis block
    this.initializeChain();
  }

  static getInstance(): ExamBlockchain {
    if (!ExamBlockchain.instance) {
      ExamBlockchain.instance = new ExamBlockchain();
    }
    return ExamBlockchain.instance;
  }

  private async initializeChain() {
    // Create genesis block
    const genesisBlock = new Block(
      {
        packageId: 'GENESIS',
        timestamp: Date.now(),
        location: [0, 0],
        action: 'SEAL',
        verifier: {
          id: 'SYSTEM',
          role: 'SYSTEM'
        },
        evidence: {
          sealCondition: true,
          qrData: 'GENESIS_BLOCK'
        },
        previousHash: '0'
      },
      '0'
    );
    await genesisBlock.mine();
    this.chain.push(genesisBlock);

    // Load chain from localStorage if available
    this.loadChain();
  }

  private loadChain() {
    try {
      const savedChain = localStorage.getItem('examBlockchain');
      if (savedChain) {
        const parsedChain = JSON.parse(savedChain);
        if (Array.isArray(parsedChain) && parsedChain.length > 0) {
          this.chain = parsedChain.map(blockData => {
            const block = new Block(blockData.data, blockData.previousHash);
            block.hash = blockData.hash;
            return block;
          });
        }
      }
    } catch (error) {
      console.error('Error loading blockchain:', error);
    }
  }

  private saveChain() {
    try {
      localStorage.setItem('examBlockchain', JSON.stringify(this.chain));
    } catch (error) {
      console.error('Error saving blockchain:', error);
    }
  }

  async addBlock(data: Omit<BlockData, 'previousHash'>): Promise<string> {
    const previousBlock = this.chain[this.chain.length - 1];
    const newBlock = new Block(
      {
        ...data,
        previousHash: previousBlock.hash
      },
      previousBlock.hash
    );

    await newBlock.mine();
    this.chain.push(newBlock);
    this.saveChain();
    return newBlock.hash;
  }

  async verifyChain(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify hash linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Verify block hash
      const validHash = await generateBlockchainHash({
        data: currentBlock.data,
        previousHash: currentBlock.previousHash,
        timestamp: currentBlock.data.timestamp
      });

      if (validHash !== currentBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getPackageHistory(packageId: string): Block[] {
    return this.chain.filter(block => block.data.packageId === packageId);
  }

  generateReport(packageId: string): DeliveryReport {
    const history = this.getPackageHistory(packageId);
    return {
      packageId,
      sealing: history.find(b => b.data.action === 'SEAL'),
      checkpoints: history.filter(b => b.data.action === 'CHECKPOINT'),
      delivery: history.find(b => b.data.action === 'DELIVERY'),
      totalVerifications: history.length,
      timestamps: {
        sealed: history[0]?.data.timestamp,
        delivered: history[history.length - 1]?.data.timestamp
      }
    };
  }

  getChainStats(): BlockchainStats {
    return {
      totalBlocks: this.chain.length,
      activePackages: new Set(this.chain.map(b => b.data.packageId)).size - 1, // Exclude genesis
      lastBlockTime: this.chain[this.chain.length - 1]?.data.timestamp,
      verifiedDeliveries: this.chain.filter(b => b.data.action === 'DELIVERY').length
    };
  }
}

interface DeliveryReport {
  packageId: string;
  sealing?: Block;
  checkpoints: Block[];
  delivery?: Block;
  totalVerifications: number;
  timestamps: {
    sealed?: number;
    delivered?: number;
  };
}

interface BlockchainStats {
  totalBlocks: number;
  activePackages: number;
  lastBlockTime?: number;
  verifiedDeliveries: number;
} 