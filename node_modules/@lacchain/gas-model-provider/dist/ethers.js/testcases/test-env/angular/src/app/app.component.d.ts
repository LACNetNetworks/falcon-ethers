import { ethers } from 'ethers';
declare global {
    interface Window {
        ethereum: any;
    }
}
export declare class AppComponent {
    title: string;
    network?: ethers.Network;
    connect(): Promise<void>;
}
//# sourceMappingURL=app.component.d.ts.map