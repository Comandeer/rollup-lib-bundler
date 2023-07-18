#!/usr/bin/env node

import CLI from '../index.js';

const cli = new CLI();

await cli.prompt();
