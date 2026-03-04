export {
  EAS_CONTRACTS,
  EAS_ABI,
  SCHEMA_REGISTRY_ABI,
  OTTP_SCHEMAS,
  ZERO_BYTES32,
  ZERO_ADDRESS,
  NO_EXPIRATION,
  type EasChain,
  type OttpSchemaName,
} from "./contracts";

export {
  encodeSubjectData,
  encodeObjectData,
  encodeBlockData,
  encodeLinkData,
} from "./encode";

export {
  registerSchema,
  createAttestation,
  publishSubject,
  publishObject,
  publishLink,
  batchPublishAll,
  getUnpublishedCounts,
  type BatchPublishResult,
} from "./operations";

export { getSchemaUids, schemasReady } from "./config";
