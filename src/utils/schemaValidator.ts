import Ajv, { JSONSchemaType, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

export const validateSchema = <T>(schema: object, data: unknown): ValidationResult => {
  const validate = ajv.compile(schema as JSONSchemaType<T>);
  const valid = validate(data) as boolean;
  return { valid, errors: validate.errors ?? [] };
};

export const assertSchema = <T>(schema: object, data: unknown, label = 'response'): T => {
  const { valid, errors } = validateSchema<T>(schema, data);
  if (!valid) {
    const formatted = errors.map((e) => `  - ${e.instancePath} ${e.message}`).join('\n');
    throw new Error(`Schema validation failed for ${label}:\n${formatted}`);
  }
  return data as T;
};
