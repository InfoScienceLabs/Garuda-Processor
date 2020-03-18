import * as crypto from "crypto";
import { TransactionHandler } from 'sawtooth-sdk/processor/handler';
const {  InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
// import { LoggerInstance } from "winston";

import * as cbor from 'cbor';

import { createProp, transferProp, createCert } from './explorerFunc';
import { env } from './env';

const _hash = (x: any) =>
  crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);

export const makeAddress = (id: any) =>
  TP_NAMESPACE + _hash(id).slice(-64);

const TP_FAMILY: string = env.familyName;
const TP_VERSION: string = env.familyVersion;
const TP_NAMESPACE: string = env.familyPrefix;

export default class ExpHandler extends TransactionHandler {

  constructor() {
    super(TP_FAMILY, [TP_VERSION], [TP_NAMESPACE]);
  }

  apply(transactionProcessRequest: any, context: any) {
    let payload:any
    try {
    payload = cbor.decode(transactionProcessRequest.payload);
    console.log('DEcoded Payload', payload);
    } catch (err) {
      throw new InvalidTransaction('Failed to decode Payload: ' + err);
    }
    payload.data.transactionId = transactionProcessRequest.signature;

    //Calculate the addresses from details in payload
    let propAddress = makeAddress(payload.data.propId);

    var userAddress: any = [];
    if (payload.data.owner) {
      for (let i = 0; i < payload.data.owner.length; i++) {
        userAddress.push(makeAddress(payload.data.owner[i]));
      }
    } else if (payload.data.seller) {
      for (let i = 0; i < payload.data.seller.length; i++) {
        userAddress.push(makeAddress(payload.data.seller[i]));
      }
    } else {
      throw new InvalidTransaction('Owner Address cannot be calculated');
    }

    let certAddress = null;
    let transferAddress: any = false;
    let contractAddress: any = false;

    if (payload.data.certificate && payload.data.certificate.length > 1) {
      certAddress = makeAddress(payload.data.certificate);
    }

    if (payload.data.buyer && payload.data.buyer.length > 1) {
      transferAddress = makeAddress(payload.data.buyer[0]);
    }

    if (payload.data.contract && payload.data.contract.length > 1) {
      contractAddress = makeAddress(payload.data.contract);
    }

    let actionFn: any = createProp;
    if (payload.action === 'create') {
      if (payload.entity === 'Certificate') {
        console.log('Confirming the property');
        actionFn = createCert;
      } else if (payload.entity === 'contract') {
        transferAddress = makeAddress(payload.data.buyer[0]);
        console.log('Transfer Address ', transferAddress);
        console.log('Transferring the property');
        actionFn = transferProp;
      } else {
        console.log('Creating the Property');
        actionFn = createProp;
      }
    } else {
      throw new InvalidTransaction(
        `Invalid action ${payload.action}`
      );
    }

    if (payload.entity === 'contract') {
        return actionFn(context, propAddress, payload, userAddress, certAddress, transferAddress, contractAddress)
    } else {
      console.log('CREATING');
        return actionFn(context, propAddress, payload, userAddress, certAddress)
    }
  }
}
