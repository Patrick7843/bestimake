import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/ideogram/generate', async (req, res) => {
  try {
    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.VITE_IDEOGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add proxy endpoint for fetching images
app.post('/api/proxy-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the content type and other headers from the response
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*'
    });

    // Get the image data as a buffer
    const imageData = await response.arrayBuffer();
    
    // Send the buffer
    res.send(Buffer.from(imageData));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
}); 