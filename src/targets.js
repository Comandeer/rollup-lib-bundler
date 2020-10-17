import { engines } from '../package.json';

const node = engines.node.replace( /[<=>~^]/g, '' );

export { node };
