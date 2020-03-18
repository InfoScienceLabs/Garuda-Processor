'use strict';

var sortJSON = require("./jsonObjSort.js");
import { InvalidTransaction } from 'sawtooth-sdk/processor/exceptions';
import { Property, UserData } from './model'
import { encode, decode } from './encoding'
import { addPropData, addPropDetails, updatePropData } from './database';
import { makeAddress } from './explorer_handler'

// const _setEntry = (context: any, address: string, stateValue: any) => {
//   let stateArray = sortJSON.arraySort(stateValue);
//   let entries = {
//     [address]: encoder.encode(JSON.stringify(stateArray))
//   };
//   // console.log('ENtries', stateArray);
//   // console.log('................');
//   return context.setState(entries);
// };

export const createProp = async (context: any, propAddress: string, payload: any, userAddress: any) => {
  console.log('HERE');
  let stateValueRep = await context.getState([propAddress]);
  // let propValue = stateValueRep[propAddress];
  // stateValueRep = propValue;
  let propData: any = {};
  payload.data.certificate = null;
  payload.data.contract = null;
  if (stateValueRep[propAddress].length > 0) {
    throw new InvalidTransaction(`Property  already exists with the id: ${payload.data.propId}`);
  } else {
    propData = payload.data;
    propData.transactionList = [];
    propData.transactionList.push(payload.data.transactionId);
  }

  for (let i = 0; i < userAddress.length; i++) {
    let userAdd = userAddress[i];
    stateValueRep = await context.getState([userAdd]);
    let userData = {};

    if (stateValueRep[userAdd].length == 0 || stateValueRep[userAdd] == null) {
      userData['propIdList'] = [];
      userData['transIds'] = [];
      userData['transIds'].push(payload.data.transactionId);
      userData['propIdList'].push(payload.data.propId);

      userData['certList'] = [];
      userData['contractList'] = [];
    } else {
      let userValue = stateValueRep[userAdd];
      let data: any = decode(userValue);

      data['propIdList'].push(payload.data.propId);
      data['transIds'].push(payload.data.transactionId);
      userData = data;
      console.log('USERDATA', data);
    }
    let userUpdates = {
      [userAdd]: encode(userData)
    };
    context.setState(userUpdates);
  }
  let propUpdates = {
    [propAddress]: encode(propData)
  };
  addPropData(payload.data);
  payload.data.type = "Property Creation";
  addPropDetails(payload.data);
  return context.setState(propUpdates);
};

export const createCert = async (context: any, propAddress: any, payload: any, userAddress: any, certAddress: any) => {

  let propStateValue = await context.getState([propAddress]);
  let propData: any

  if (propStateValue[propAddress] == null || propStateValue[propAddress].length == 0) {
    console.log('There is no property to confirm');
    throw new InvalidTransaction('There is no property to confirm with ID ', payload.data.propId);
  } else {
    propData = decode(propStateValue[propAddress]);
    propData.certificate = payload.data.certificate;
    propData.transactionList.push(payload.data.transactionId);
    let propUpdates = {
      [propAddress]: encode(propData)
    }

    context.setState(propUpdates);
  }

  for (let i = 0; i < userAddress.length; i++) {
    let userAdd = userAddress[0];
    let userStateValue = await context.getState([userAdd]);
    let userStateValueRep = userStateValue[userAdd];
    if (userStateValueRep == null || userStateValueRep.length === 0) {
      throw new InvalidTransaction(`User does not exist: ${payload.data.owner[0]}`);
    } else {
      let userData = decode(userStateValueRep);
      userData.transIds.push(payload.data.transactionId);
      userData.certList.push(payload.data.certificate);
      console.log('User Data', userData)
      let userUpdates = {
        [userAdd]: encode(userData)
      };
      context.setState(userUpdates);
    }
  }

  updatePropData(propData);
  payload.data.contract = null;
  payload.data.type = "Property Confirmation";
  addPropDetails(payload.data);
  let certData:any = {
    valid: true,
    certificate: propData.certificate,
    owner: propData.owner,
    propId: propData.propId,
    transactionList: [payload.data.transactionId]
  };
  // certData.valid = true;
  // certData.certificate
  let certUpdates = {
    [certAddress]: encode(certData)
  };

  return context.setState(certUpdates);

};

export const transferProp = async (context: any, propAddress: any, payload: any, userAddress: any, certAddress: any, newOwnerAddress: any, contractAddress: any) => {
  // console
  let propStateValue = await context.getState([propAddress]);
  let cert: any;
  if (propStateValue[propAddress] == null || propStateValue[propAddress].length === 0) {
    throw new InvalidTransaction('There is no property to confirm with ID ', payload.data.propId);

  } else {
    let propData = decode(propStateValue[propAddress]);
    console.log('Data at the property', propData);
    cert = propData.certificate;
    if (!propData['prevOwnerList']) {
      propData['prevOwnerList'] = [];
    }
    propData.prevOwnerList.push(propData.owner);

    if (!propData['prevCertList']) {
      propData['prevCertList'] = [];
    }
    propData.prevCertList.push(propData.certificate);

    if (!propData['prevContractList']) {
      propData['prevContractList'] = [];
    }
    if (propData.contract) {
      propData.prevContractList.push(propData.contract);
    }

    propData.certificate = payload.data.certificate;
    propData.transactionList.push(payload.data.transactionId);
    propData.contract = payload.data.contract;
    propData.owner = payload.data.buyer;

    let propUpdates = {
      [propAddress]: encode(propData)
    }

    context.setState(propUpdates);
    updatePropData(payload.data);
    payload.data.type = "Property Transfer";
    addPropDetails(payload.data);
  }

  for (let i = 0; i < userAddress.length; i++) {
    let userData: any = {};
    let userAddr = userAddress[i];
    let userStateValue = await context.getState([userAddr]);
    let userStateValueRep = userStateValue[userAddr];

    if (userStateValueRep == null || userStateValueRep.length === 0) {
      console.log('User does not contain any properties to transfer');
      return false;
    } else {
      let data = decode(userStateValue[userAddr]);

      if (!data['prevProperties']) {
        data['prevProperties'] = [];
      }
      data['prevProperties'].push(payload.data.propId);

      let propIndex = data['propIdList'];
      var index = propIndex.indexOf(payload.data.propId);
      if (index > -1) {
        console.log('DELETING FROM PROP LIST');
        data['propIdList'].splice(index, 1);
      }

      if (!data['prevCertList']) {
        data['prevCertList'] = [];
      }
      data['prevCertList'].push(data.certList[index]);

      let certIndex = data['certList'];
      index = certIndex.indexOf(cert);
      if (index > -1) {
        console.log('DELETING FROM CERT LIST');
        data['certList'].splice(index, 1);
      }

      data['transIds'].push(payload.data.transactionId);

      if (!data['contractList']) {
        data['contractList'] = [];
      }
      data['contractList'].push(payload.data.contract);
      userData = data;
      let userUpdates = {
        [userAddr]: encode(userData)
      };
      context.setState(userUpdates);
    }
  }

  let sellerData: any = {};
  let userAddr = newOwnerAddress;
  let userStateValue = await context.getState([userAddr]);
  let userStateValueRep = userStateValue[userAddr];

  if (userStateValueRep == null || userStateValueRep.length === 0) {
    sellerData['propIdList'] = [];
    sellerData['propIdList'].push(payload.data.propId);

    sellerData['transIds'] = [];
    sellerData['transIds'].push(payload.data.transactionId);

    sellerData['certList'] = [];
    sellerData['certList'].push(payload.data.certificate);

    sellerData['contractList'] = [];
    sellerData['contractList'].push(payload.data.contract);

    let userUpdates = {
      [userAddr]: encode(sellerData)
    };
    context.setState(userUpdates);
  } else {
    let data = decode(userStateValue[userAddr]);
    data['propIdList'].push(payload.data.propId);

    data['transIds'].push(payload.data.transactionId);

    data['certList'].push(payload.data.certificate);
    data['contractList'].push(payload.data.contract);

    let userUpdates = {
      [userAddr]: encode(data)
    };
    context.setState(userUpdates);

  }
  let certData: any = {
    propId: payload.data.propId,
    owner: payload.data.buyer,
    transactionList: [payload.data.transactionId],
    certificate: payload.data.certificate,
    contract: payload.data.contract,
    valid: true,
    timestamp: payload.data.timestamp
  };

  let certUpdates = {
    [certAddress]: encode(certData)
  }

  context.setState(certUpdates);

  certData.buyer = payload.data.buyer;
  certData.seller = payload.data.seller;
  certData.transactionId = payload.data.transactionId;

  let contractUpdates = {
    [contractAddress]: encode(certData)
  }
  context.setState(contractUpdates);

  let prevCertAddress = makeAddress(cert);
  let certStateValue = await context.getState([prevCertAddress]);

  if (certStateValue[prevCertAddress] == null || certStateValue[prevCertAddress].length == 0) {
    return 'There is no certificate to disable'
  } else {
    let prevCertData = decode(certStateValue[prevCertAddress]);
    prevCertData.valid = false;
    prevCertData.transactionList.push(payload.data.transactionId);

    let prevCertUpdates = {
      [prevCertAddress]: encode(prevCertData)
    }

    context.setState(prevCertUpdates);
  }
};