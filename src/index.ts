import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import 'reflect-metadata';
import cors from 'cors';
import mongoose from 'mongoose';

import './services/helpers/Secrets'
import { NotFoundError } from './errors/NotFoundError';
import { errorHandler } from './middlewares/ErrorHandler';

import cron from 'node-cron';
import { MigrationManager } from './services/MigrationManager';
import { MixpanelManager } from './services/analytics/MixpanelManager';
import { cleanRouter } from './routes/v1/Clean';
import { Clean } from './entities/Clean';
import { Auth } from './entities/auth/Auth';
import { authRouter } from './routes/v1/Auth';

const app = express();
app.use(json());
app.use(cors());

if (process.env.API_ENABLED == 'true'){
    app.use(authRouter);
    app.use(cleanRouter);
}

app.all('*', async () => {
    throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
    await mongoose.connect(process.env.MONGODB_CONNECTION_URL!);
    console.log('Connected to mongodb!');

    await Auth.syncIndexes();
    await Clean.syncIndexes();

    await MixpanelManager.init();
    await MigrationManager.migrate();

    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`Listening on port ${port}.`);

        setupCron();
    });
}

const setupCron = async () => {
    if (process.env.CRON_ENABLED == 'true'){
        cron.schedule('*/3 * * * * *', () => {
            //TODO: don't do this. use Helius webhooks
            // CleanManager.processProcessingTransactions();
        });
    }
}

start();