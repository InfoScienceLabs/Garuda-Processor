'use strict';

const { TransactionProcessor } = require('sawtooth-sdk/processor');

import ExpHandler from './explorer_handler';
import { env } from './env';

const transactionProcessor = new TransactionProcessor(env.validatorUrl);

const handler: ExpHandler = new ExpHandler();
// Add Transaction Processor Handler to TP
transactionProcessor.addHandler(handler);

console.log(`Starting garuda transaction processor`);
// Start Transaction Processor
transactionProcessor.start();

console.log(`Connecting to Sawtooth validator at ${env.validatorUrl}`);