// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExamDelivery {
    enum DeliveryStatus { PENDING, IN_TRANSIT, DELIVERED, VERIFIED }
    
    struct Delivery {
        string packageId;
        address boardAuthority;
        address[] collegeAddresses;
        uint256 departureTime;
        mapping(address => bool) deliveryConfirmations;
        DeliveryStatus status;
        bytes32 examHash;
    }
    
    mapping(string => Delivery) public deliveries;
    mapping(address => bool) public authorizedPersonnel;
    
    event DeliveryStatusUpdated(
        string packageId,
        DeliveryStatus status,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        string packageId,
        address college,
        uint256 timestamp
    );
    
    modifier onlyAuthorized() {
        require(authorizedPersonnel[msg.sender], "Not authorized");
        _;
    }
    
    constructor() {
        authorizedPersonnel[msg.sender] = true; // Contract deployer is authorized
    }
    
    function addAuthorizedPerson(address person) external onlyAuthorized {
        authorizedPersonnel[person] = true;
    }
    
    function initiateDelivery(
        string calldata packageId,
        address[] calldata colleges,
        bytes32 examHash
    ) external onlyAuthorized {
        Delivery storage delivery = deliveries[packageId];
        delivery.packageId = packageId;
        delivery.boardAuthority = msg.sender;
        delivery.collegeAddresses = colleges;
        delivery.departureTime = block.timestamp;
        delivery.status = DeliveryStatus.IN_TRANSIT;
        delivery.examHash = examHash;
        
        emit DeliveryStatusUpdated(packageId, DeliveryStatus.IN_TRANSIT, block.timestamp);
    }
    
    function confirmDelivery(string calldata packageId) external {
        Delivery storage delivery = deliveries[packageId];
        require(delivery.departureTime > 0, "Delivery not initiated");
        
        bool isCollege = false;
        for(uint i = 0; i < delivery.collegeAddresses.length; i++) {
            if(delivery.collegeAddresses[i] == msg.sender) {
                isCollege = true;
                break;
            }
        }
        require(isCollege, "Not authorized college");
        
        delivery.deliveryConfirmations[msg.sender] = true;
        emit DeliveryConfirmed(packageId, msg.sender, block.timestamp);
        
        // Check if all colleges confirmed
        bool allConfirmed = true;
        for(uint i = 0; i < delivery.collegeAddresses.length; i++) {
            if(!delivery.deliveryConfirmations[delivery.collegeAddresses[i]]) {
                allConfirmed = false;
                break;
            }
        }
        
        if(allConfirmed) {
            delivery.status = DeliveryStatus.VERIFIED;
            emit DeliveryStatusUpdated(packageId, DeliveryStatus.VERIFIED, block.timestamp);
        }
    }
    
    function getDeliveryStatus(string calldata packageId) external view returns (
        DeliveryStatus status,
        uint256 departureTime,
        address boardAuthority,
        bytes32 examHash
    ) {
        Delivery storage delivery = deliveries[packageId];
        return (
            delivery.status,
            delivery.departureTime,
            delivery.boardAuthority,
            delivery.examHash
        );
    }
    
    function isDeliveryConfirmed(string calldata packageId, address college) external view returns (bool) {
        return deliveries[packageId].deliveryConfirmations[college];
    }
} 