import * as crypto from "crypto";

const _hash = (x:any) =>
  crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);

export const env = {
  restApiUrl: 'http://rest-api:8008',
  validatorUrl: "tcp://localhost:4004",
  familyName: 'gblock',
  familyPrefix: _hash('gblock').substring(0, 6),
  familyVersion: '1.0',
  rethinkUrl: '127.0.0.1',
  rethinkPort: '8080',
};
