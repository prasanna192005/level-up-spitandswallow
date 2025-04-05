export const EXAM_DELIVERY_ABI = [
  // Events
  "event DeliveryStatusUpdated(string packageId, string status, uint256 timestamp)",
  "event PackageVerified(string packageId, address verifier, uint256 timestamp)",
  
  // Functions
  "function updateDeliveryStatus(string packageId, string status, tuple(number, number) location, bytes signature) public",
  "function verifyPackage(string packageId) public returns (bool)",
  "function getPackageData(string packageId) public view returns (tuple(string id, string examHash, string sealedBy, tuple(uint256 collegeId, tuple(number, number) location, uint256 expectedTime)[] deliveryRoute, tuple(bool tamperProof, bool temperatureOk, bool humidityOk) securityFeatures))",
  "function verifySignature(string packageId, bytes signature) public view returns (bool)"
] as const;

export interface ExamDeliveryContract {
  updateDeliveryStatus: (
    packageId: string,
    status: string,
    location: [number, number],
    signature: string
  ) => Promise<ethers.ContractTransaction>;
  
  verifyPackage: (
    packageId: string
  ) => Promise<boolean>;
  
  getPackageData: (
    packageId: string
  ) => Promise<PackageData>;
  
  verifySignature: (
    packageId: string,
    signature: string
  ) => Promise<boolean>;
} 