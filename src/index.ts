import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import { nftDataLoader } from './services/NFTDataLoader';

const app: Express = express();
const port = process.env.PORT;

app.get('/hello', async (req, res) => {
    res.json({hello: "world"})
})

app.get('/nfts/:address', async (req: Request, res: Response) => {
    try {
        const results = await nftDataLoader.listNFTs(req.params.address)
        res.json({
            status: 'ok',
            results,
        }).status(200)
    } catch (e: any) {
        res.json({
            status: 'error',
            message: e.message
        }).status(500)
    }
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});