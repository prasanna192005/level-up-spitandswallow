import { EventEmitter } from 'events';

export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'VERIFIED';

export interface DeliveryPackage {
  packageId: string;
  examHash: string;
  boardAuthority: string;
  colleges: {
    id: number;
    name: string;
    position: [number, number];
    confirmed: boolean;
  }[];
  departureTime?: number;
  status: DeliveryStatus;
}

class LocalDeliveryService extends EventEmitter {
  private packages: Map<string, DeliveryPackage> = new Map();
  private authorizedPersonnel: Set<string> = new Set();

  constructor() {
    super();
    // Add some demo authorized personnel
    this.authorizedPersonnel.add('board_admin');
    this.authorizedPersonnel.add('transport_officer');
  }

  public async initiateDelivery(
    authority: string,
    packageId: string,
    colleges: { id: number; name: string; position: [number, number] }[]
  ): Promise<DeliveryPackage> {
    if (!this.authorizedPersonnel.has(authority)) {
      throw new Error('Not authorized');
    }

    // Create package data to hash
    const packageData = {
      packageId,
      authority,
      colleges: colleges.map(c => c.id),
      timestamp: Date.now(),
      nonce: Math.random().toString()
    };

    const examHash = await this.generateBlockchainHash(packageData);

    const newPackage: DeliveryPackage = {
      packageId,
      examHash,
      boardAuthority: authority,
      colleges: colleges.map(college => ({ ...college, confirmed: false })),
      departureTime: Date.now(),
      status: 'IN_TRANSIT'
    };

    this.packages.set(packageId, newPackage);
    this.emit('deliveryUpdated', newPackage);
    return newPackage;
  }

  public confirmDelivery(packageId: string, collegeId: number): boolean {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      throw new Error('Package not found');
    }

    const college = pkg.colleges.find(c => c.id === collegeId);
    if (!college) {
      throw new Error('College not found');
    }

    college.confirmed = true;
    
    // Check if all colleges confirmed
    const allConfirmed = pkg.colleges.every(c => c.confirmed);
    if (allConfirmed) {
      pkg.status = 'VERIFIED';
    } else {
      pkg.status = 'DELIVERED';
    }

    this.emit('deliveryUpdated', pkg);
    return true;
  }

  public getDeliveryStatus(packageId: string): DeliveryPackage | undefined {
    return this.packages.get(packageId);
  }

  public getAllDeliveries(): DeliveryPackage[] {
    return Array.from(this.packages.values());
  }

  private async generateBlockchainHash(data: any): Promise<string> {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Convert string to bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonString);
    
    // Generate SHA-256 hash (similar to what's used in blockchain)
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return '0x' + hashHex; // Add '0x' prefix like in Ethereum
  }
}

// Create a singleton instance
export const deliveryService = new LocalDeliveryService(); 