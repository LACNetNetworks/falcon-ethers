import { AccessListish, AddressLike, BigNumberish, BlockTag, TransactionRequest } from 'ethers';
export declare class LacchainTransactionRequest implements TransactionRequest {
    private _aOriginalTransactionRequest;
    private _aNodeAddress;
    private _aExpirationTime;
    constructor(_aOriginalTransactionRequest: TransactionRequest, _aNodeAddress: string, _aExpirationTime: number);
    get data(): any | string;
    get chainId(): any | BigNumberish;
    get type(): any | number;
    get to(): any | AddressLike;
    get from(): any | AddressLike;
    get nonce(): any | number;
    get gasLimit(): any | BigNumberish;
    get gasPrice(): any | BigNumberish;
    get maxPriorityFeePerGas(): any | BigNumberish;
    get maxFeePerGas(): any | BigNumberish;
    get value(): any | BigNumberish;
    get accessList(): any | AccessListish;
    get customData(): any;
    get blockTag(): undefined | BlockTag;
    get enableCcipRead(): undefined | boolean;
}
//# sourceMappingURL=lacchain-transaction-request.d.ts.map