import { AccessList, Signature, Transaction, TransactionLike } from 'ethers';
export declare class LacchainTransaction implements TransactionLike {
    private _aOriginalTx;
    private _aHashTx;
    constructor(_aOriginalTx: Transaction, _aHashTx: string);
    get hash(): null | string;
    get type(): null | number;
    get typeName(): null | string;
    get to(): null | string;
    get nonce(): number;
    get gasLimit(): bigint;
    get gasPrice(): null | bigint;
    get maxPriorityFeePerGas(): null | bigint;
    get maxFeePerGas(): null | bigint;
    get data(): string;
    get value(): bigint;
    get chainId(): bigint;
    get signature(): null | Signature;
    get accessList(): null | AccessList;
    get unsignedHash(): string;
    get from(): null | string;
    get fromPublicKey(): null | string;
    get serialized(): string;
    get unsignedSerialized(): string;
}
//# sourceMappingURL=lacchain-transaction.d.ts.map