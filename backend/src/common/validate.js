import { ValidationError } from './errors.js';

export function validateSchema(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    throw new ValidationError('Invalid request payload', details);
  }
  return result.data;
}
