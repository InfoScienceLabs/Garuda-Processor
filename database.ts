import { sha256 } from 'js-sha256';


var r = require('rethinkdbdash')({
    db: 'explorer'
})

export async function addPropData(payload: any) {
    r.table('PropData')
        .insert(payload)
        .run()
        .then(function (response: any) {
            console.log('Data added to  PropData Database');
        })
        .error(function (err: Error) {
            console.log('error occurred ', err);
        });
}

export async function addPropDetails(details: any) {
    r.table('PropDetails')
        .insert({
            primId: sha256(details.transactionId),
            owner: details.owner || details.buyer,
            propId: details.propId,
            certificate: details.certificate,
            contract: details.contract,
            transactionId: details.transactionId,
            type: details.type
        })
        .run()
        .then(function (response: any) {
            console.log('Data added to PropDetails Database');
            // return true;
        })
        .error(function (err: Error) {
            console.log('error occurred ', err);
            // return true;
        });

}

export function updatePropData(data: any) {
     r.table("PropData").get(data.propId).replace({
        propId: data.propId,
        certificate: data.certificate,
        contract: data.contract,
        owner: data.owner || data.buyer,
        transactionId: data.transactionId,
        transactionList: data.transactionList,
        prop: data.prop,
        timeStamp: data.timeStamp,
        type: data.type
    })
        .run()
        .then(function (response: any) {
            console.log('Data updated in Prop Data');
            // return true;
        })
        .error(function (err: Error) {
            console.log(err);
            // return true;
        });
        // return resp;
}