import express from 'express';

const app = express();

export default app;

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

export default app;