import Web3 from "web3"

if (!process.env.NODE_URL) {
    throw new Error(`NODE_URL environmental variable is not set.`)
}

const TRANSFER_EVENT_HASH = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

export class NFTDataLoader {
    web3: Web3
    constructor(nodeEndpoint: string) {
        this.web3 = new Web3(nodeEndpoint)
    }

    async listNFTs(targetAddress: string) {
        const targetAddressAsHexValue = this.web3.eth.abi.encodeParameter('address', targetAddress)
        const [receiverResults, senderResults] = await Promise.all([
            this.web3.eth.getPastLogs({
                fromBlock: 1,
                toBlock: 'latest',
                topics: [TRANSFER_EVENT_HASH, null, targetAddressAsHexValue]
            }),
            this.web3.eth.getPastLogs({
                fromBlock: 1,
                toBlock: 'latest',
                topics: [TRANSFER_EVENT_HASH, targetAddressAsHexValue, null]
            })
        ])

        const results = [
            ...receiverResults,
            ...senderResults,
        ].sort((a: any, b: any) => {
            if (a.blockNumber < b.blockNumber) {
                return -1
            }
            if (a.blockNumber > b.blockNumber) {
                return 1
            }
            if (a.blockNumber === b.blockNumber) {
                if (a.transactionIndex < b.transactionIndex) {
                    return -1
                }
                if (a.transactionIndex > b.transactionIndex) {
                    return 1
                }
            }
            return 0
        })

        const tmp: any = {}
        for (let i = 0; i < results.length; i++) {
            if (results[i].topics.length !== 4) {
                continue;
            }
            const address = results[i].address
            const sender = this.web3.eth.abi.decodeParameter('address', results[i].topics[1]).toString()
            const receiver = this.web3.eth.abi.decodeParameter('address', results[i].topics[2]).toString()
            const tokenId = this.web3.eth.abi.decodeParameter('uint256', results[i].topics[3]).toString()
            if (!tmp[address]) {
                tmp[address] = {}
            }
            if (sender === targetAddress) {
                tmp[address][tokenId] = false
            }
            if (receiver === targetAddress) {
                tmp[address][tokenId] = true
            }
        }

        const userOwnedNFTs: { address: string, tokenId: string }[] = []
        const addresses = Object.keys(tmp)
        for (let i = 0; i < addresses.length; i++) {
            const tokenIds = Object.keys(tmp[addresses[i]])
            for (let j = 0; j < tokenIds.length; j++) {
                if (tmp[addresses[i]][tokenIds[j]] === true)
                    userOwnedNFTs.push({ address: addresses[i], tokenId: tokenIds[j] })
            }
        }
        return userOwnedNFTs
    }
}

export const nftDataLoader = new NFTDataLoader(process.env.NODE_URL)