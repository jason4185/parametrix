import { CONTRACT_READ_METHODS, CONTRACT_WRITE_METHODS } from "@/lib/constants";

export const PARAMETRIX_READ_METHODS = CONTRACT_READ_METHODS;
export const PARAMETRIX_WRITE_METHODS = CONTRACT_WRITE_METHODS;

export type ParametrixReadMethod =
  (typeof PARAMETRIX_READ_METHODS)[keyof typeof PARAMETRIX_READ_METHODS];

export type ParametrixWriteMethod =
  (typeof PARAMETRIX_WRITE_METHODS)[keyof typeof PARAMETRIX_WRITE_METHODS];
