export type DeliveryStatus = {
  packageId: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'VERIFIED';
  timestamp: number;
  location: [number, number];
  signatures: string[];
  verifications: {
    verifier: string;
    timestamp: number;
  }[];
};

export type PackageData = {
  id: string;
  examHash: string;
  sealedBy: string;
  deliveryRoute: {
    collegeId: number;
    location: [number, number];
    expectedTime: number;
  }[];
  securityFeatures: {
    tamperProof: boolean;
    temperatureOk: boolean;
    humidityOk: boolean;
  };
}; 