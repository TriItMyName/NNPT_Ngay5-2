const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API = "https://api.escuelajs.co/api/v1/products";

// Simple in-memory cache so page reloads don't reshuffle data on each request.
// Note: cache persists only while the server is running.
const cache = new Map();
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 50;
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey({ offset, limit }) {
    return `${offset}:${limit}`;
}

function getCachedProducts({ offset, limit }) {
    const key = getCacheKey({ offset, limit });
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCachedProducts({ offset, limit, data }) {
    const key = getCacheKey({ offset, limit });
    cache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}

// GetAPI (frontend calls /api/products)
app.get('/api/products', async (req, res) => {
    try {
        const offset = Number.isFinite(+req.query.offset) ? +req.query.offset : DEFAULT_OFFSET;
        const limit = Number.isFinite(+req.query.limit) ? +req.query.limit : DEFAULT_LIMIT;
        const refresh = req.query.refresh === '1' || req.query.refresh === 'true';

        if (!refresh) {
            const cached = getCachedProducts({ offset, limit });
            if (cached) return res.json(cached);
        }

        const response = await axios.get(API, {
            params: { offset, limit },
        });

        // Ensure stable ordering between requests.
        const data = Array.isArray(response.data)
            ? [...response.data].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0))
            : response.data;

        setCachedProducts({ offset, limit, data });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// PostAPI
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = req.body;
        const response = await axios.post(API, newProduct);
        cache.clear();
        res.status(201).json(response.data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PutAPI
app.put('/api/products/:id', async (req, res) => {
    try {
        const result = req.body;
        const { id } = req.params;
        const response = await axios.put(`${API}/${id}`, result);
        cache.clear();
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DeleteAPI
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await axios.delete(`${API}/${id}`);
        cache.clear();
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});




