export interface Property {
    propId: any,
    certificate: any,
    contract: string,
    owner: Array<string>,
    transactionList: Array<string>
}

export interface UserData {
    certList: Array<string>,
    contractList: Array<string>,
    transIds: Array<string>,
    propIdList: Array<string>
}