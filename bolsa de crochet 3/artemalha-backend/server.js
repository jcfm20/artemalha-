require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const BASE_URL = process.env.MELHOR_ENVIO_BASE_URL || 'https://melhorenvio.com.br/api/v2';

// Rota principal de cálculo de frete
app.post('/api/calculate-freight', async (req, res) => {
    try {
        const { to_cep, weight = 2, width = 30, height = 15, length = 40, insurance_value = 150 } = req.body;

        if (!to_cep) {
            return res.status(400).json({ error: 'CEP de destino é obrigatório' });
        }

        // CEP de origem (Rio de Janeiro - altere conforme sua loja)
        const from_cep = '20040000';

        const payload = {
            from: { postal_code: from_cep },
            to: { postal_code: to_cep },
            package: {
                weight: parseFloat(weight),
                width: parseFloat(width),
                height: parseFloat(height),
                length: parseFloat(length)
            },
            options: {
                insurance_value: parseFloat(insurance_value)
            }
        };

        const response = await axios.post(`${BASE_URL}/me/shipment/calculate`, payload, {
            headers: {
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Filtra e formata as opções mais relevantes
        const options = response.data
            .filter(item => item.price && item.delivery_time)
            .map(item => ({
                id: item.id,
                name: item.name,
                price: parseFloat(item.price),
                days: item.delivery_time,
                company: item.company?.name || 'Transportadora'
            }))
            .sort((a, b) => a.price - b.price); // ordena do mais barato para o mais caro

        res.json({ success: true, options });

    } catch (error) {
        console.error('Erro ao calcular frete:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erro ao calcular frete', 
            details: error.response?.data || error.message 
        });
    }
});

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'Backend Artemalha + Melhor Envio rodando!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});