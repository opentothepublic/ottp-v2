import { type Abi, type Address } from "viem";

// ============================================
// CONTRACT ADDRESSES
// ============================================

export const EAS_CONTRACTS = {
  base: {
    eas: "0x4200000000000000000000000000000000000021" as Address,
    schemaRegistry: "0x4200000000000000000000000000000000000020" as Address,
    chainId: 8453,
    explorer: "https://base.easscan.org",
  },
  ethereum: {
    eas: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587" as Address,
    schemaRegistry:
      "0xA7b39296258348C78294F95B872b282326A97BDF" as Address,
    chainId: 1,
    explorer: "https://easscan.org",
  },
} as const;

export type EasChain = keyof typeof EAS_CONTRACTS;

// ============================================
// OTTP SCHEMA DEFINITIONS
// ============================================

// These are the schema strings registered on EAS.
// After registration, we store the resulting UIDs here.
export const OTTP_SCHEMAS = {
  subject: {
    schema: "string name, string metadata",
    revocable: true,
    // UIDs get populated after registration
    uid: {
      base: null as string | null,
      ethereum: null as string | null,
    },
  },
  object: {
    schema: "bytes32 ownerSubject, bytes32 parentObject, string metadata",
    revocable: true,
    uid: {
      base: null as string | null,
      ethereum: null as string | null,
    },
  },
  block: {
    schema:
      "string content, string contentType, string slot, string metadata",
    revocable: true,
    uid: {
      base: null as string | null,
      ethereum: null as string | null,
    },
  },
  link: {
    schema: "bytes32 sourceUid, bytes32 targetUid, string metadata",
    revocable: true,
    uid: {
      base: null as string | null,
      ethereum: null as string | null,
    },
  },
} as const;

export type OttpSchemaName = keyof typeof OTTP_SCHEMAS;

// ============================================
// SCHEMA REGISTRY ABI (register function only)
// ============================================

export const SCHEMA_REGISTRY_ABI: Abi = [
  {
    name: "register",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schema", type: "string" },
      { name: "resolver", type: "address" },
      { name: "revocable", type: "bool" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getSchema",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "resolver", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "schema", type: "string" },
        ],
      },
    ],
  },
];

// ============================================
// EAS ABI (attest, multiAttest, revoke)
// ============================================

export const EAS_ABI: Abi = [
  // Single attestation
  {
    name: "attest",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple",
            components: [
              { name: "recipient", type: "address" },
              { name: "expirationTime", type: "uint64" },
              { name: "revocable", type: "bool" },
              { name: "refUID", type: "bytes32" },
              { name: "data", type: "bytes" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  // Multi attestation (batch)
  {
    name: "multiAttest",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "multiRequests",
        type: "tuple[]",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple[]",
            components: [
              { name: "recipient", type: "address" },
              { name: "expirationTime", type: "uint64" },
              { name: "revocable", type: "bool" },
              { name: "refUID", type: "bytes32" },
              { name: "data", type: "bytes" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  // Revoke
  {
    name: "revoke",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          {
            name: "data",
            type: "tuple",
            components: [
              { name: "uid", type: "bytes32" },
              { name: "value", type: "uint256" },
            ],
          },
        ],
      },
    ],
    outputs: [],
  },
  // Get attestation
  {
    name: "getAttestation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "uid", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "uid", type: "bytes32" },
          { name: "schema", type: "bytes32" },
          { name: "time", type: "uint64" },
          { name: "expirationTime", type: "uint64" },
          { name: "revocationTime", type: "uint64" },
          { name: "refUID", type: "bytes32" },
          { name: "recipient", type: "address" },
          { name: "attester", type: "address" },
          { name: "revocable", type: "bool" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
];

// ============================================
// ZERO CONSTANTS
// ============================================

export const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;
export const NO_EXPIRATION = 0n;
