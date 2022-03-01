import { LiveSpec } from '../builder';

export { formatter as jsonFormatter } from './json';
export { formatter as markdownFormatter } from './markdown';
export { formatter as consoleFormatter } from './console';
export { formatter as plaintextFormatter } from './plaintext';

export type Formatter = (spec: LiveSpec) => Buffer;
