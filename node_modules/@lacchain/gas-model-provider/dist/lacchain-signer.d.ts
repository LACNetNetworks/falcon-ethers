import { Provider, SigningKey, Wallet, TransactionRequest } from 'ethers';
export declare class LacchainSigner extends Wallet {
    private _aNodeAddress;
    private _aExpirationTime;
    constructor(privateKey: string | SigningKey, provider: Provider, _aNodeAddress: string, _aExpirationTime: number);
    signTransaction(transactionRequest: TransactionRequest): Promise<string>;
}
//# sourceMappingURL=lacchain-signer.d.ts.map