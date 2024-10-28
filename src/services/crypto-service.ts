// Standard ERC20 ABI for transfer function
import config from "../config";
import {ethers} from "ethers";

const ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
];


//TODO it is example hot to transfer token from wallet
export class CryptoServiceService {
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    constructor(
    ) {
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    }

    async transferToken(
        tokenAddress: string,
        recipientAddress: string,
        amount: string
    ){
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                this.wallet
            );

            const decimals = await tokenContract.decimals();

            const amountInWei = ethers.utils.parseUnits(amount, decimals);

            const balance = await tokenContract.balanceOf(this.wallet.address);
            if (balance.lt(amountInWei)) {
                throw new Error('Insufficient token balance');
            }

            const gasLimit = await tokenContract.estimateGas.transfer(
                recipientAddress,
                amountInWei
            );

            const gasPrice = await this.provider.getGasPrice();

            const tx = await tokenContract.transfer(recipientAddress, amountInWei, {
                gasLimit: gasLimit.mul(120).div(100),
                gasPrice: gasPrice
            });

            return tx;
        } catch (error: any) {
            throw new Error(`Token transfer failed: ${error.message}`);
        }
    }

    async getTokenBalance(
        tokenAddress: string,
        address: string
    ): Promise<string> {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                this.provider
            );

            const decimals = await tokenContract.decimals();
            const balance = await tokenContract.balanceOf(address);

            return ethers.utils.formatUnits(balance, decimals);
        } catch (error: any) {
            throw new Error(`Failed to get token balance: ${error.message}`);
        }
    }

    /**
     * Get token information
     */
    async getTokenInfo(tokenAddress: string): Promise<{
        symbol: string;
        decimals: number;
    }> {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                this.provider
            );

            const [symbol, decimals] = await Promise.all([
                tokenContract.symbol(),
                tokenContract.decimals(),
            ]);

            return {
                symbol,
                decimals,
            };
        } catch (error: any) {
            throw new Error(`Failed to get token info: ${error.message}`);
        }
    }
}
