import express from 'express';
import pool from './config/db.js';

const app = express();

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/v1/db-test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        res.status(200).json({ status: 'ok', dbResult: rows[0].result });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default app;