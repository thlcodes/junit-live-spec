import { Formatter } from '.';
import { LiveSpec } from '../builder';

/**
 * Format live spec as json
 */
export const formatter: Formatter = (spec: LiveSpec) => {
  return Buffer.from(JSON.stringify(spec, null, '  '));
};
