import { JsonRpcProvider, FetchRequest, Networkish, JsonRpcApiProviderOptions, PerformActionRequest, TransactionResponse } from 'ethers';
export declare class LacchainProvider extends JsonRpcProvider {
    constructor(url: string | FetchRequest, network?: Networkish, options?: JsonRpcApiProviderOptions);
    _perform(req: PerformActionRequest): Promise<any>;
    broadcastTransaction(signedTx: string): Promise<TransactionResponse>;
}
//# sourceMappingURL=lacchain-provider.d.ts.map