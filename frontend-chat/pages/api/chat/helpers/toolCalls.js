import backend from '../../../../src/services/backend';
import { fetchWithHandling } from '../utils/fetchWithHandling.js';

const API_BACKEND_URL = process.env.API_BACKEND_URL;

export async function generateImage(prompt, size, style, auth) {
    try {
        console.log('Generating image with params:', { prompt, size, style });
        
        const result = await backend.post(`${API_BACKEND_URL}/tools/generate-image`, {
            prompt,
            size,
            style,
        }, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            timeout: 60000
        });

        if (!result.data.url) {
            throw new Error('No image URL returned from generation');
        }

        return {
            url: result.data.url,
            prompt: result.prompt || prompt
        };
    } catch (error) {
        console.error('Error in generateImage:', error);
        return {
            error: true,
            message: `Failed to generate image: ${error.message}`
        };
    }
}

export async function searchWeb(query) {
    try {
        return await fetchWithHandling('http://localhost:3000/api/tools/searchWeb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
    } catch (error) {
        console.error('Error in searchWeb:', error);
        return {
            error: true,
            message: `Failed to search web: ${error.message}`
        };
    }
}

export async function wikiSearch(action, searchString, auth) {
    try {
        const response = await backend.get(`${API_BACKEND_URL}/tools/wiki-search`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`  },
            params: { action, searchString },
        });

        return response.data;
    } catch (error) {
        console.error('Error in wikiSearch:', error);
        return {
            error: true,
            message: `Failed to search Wikipedia: ${error.message}`
        };
    }
}

export async function getStockInfo(tickers, info_types, auth) {
    try {
        const result = await backend.post(`${API_BACKEND_URL}/tools/get-stock-info`, {
             tickers, info_types },
            {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}` 
                },
                timeout: 30000
            }
        );

        return result.data;
    } catch (error) {
        console.error('Error in getStockInfo:', error);
        return {
            error: true,
            message: `Failed to get stock info: ${error.message}`
        };
    }
}

export async function getCryptoInfoFromCMC(token_symbol, auth) {
    try {
        const result = await backend.get(`${API_BACKEND_URL}/tools/get-crypto-info-from-cmd/${token_symbol}`, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            timeout: 30000
        });
        
        return result.data;
    } catch (error) {
        return {
            error: true,
            message: `Failed to get crypto info from CoinMarketCap: ${error.message}`
        };
    }
}

export async function queryArxiv(search_query, max_results, sort_by, sort_order) {
    try {
        return await fetchWithHandling('http://localhost:3000/api/tools/searchArxiv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search_query, max_results, sort_by, sort_order }),
        });
    } catch (error) {
        console.error('Error in queryArxiv:', error);
        return {
            error: true,
            message: `Failed to query arXiv: ${error.message}`
        };
    }
}

export async function getTrendingCryptos(option, limit = 10, auth) {
    try {
        const response = await backend.get(`${API_BACKEND_URL}/tools/get-trending-cryptos/${option}`, {
            params: { limit },
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
        });

        return response.data;
    } catch (error) {
        console.error('Error in getTrendingCryptos:', error);
        return {
            error: true,
            message: `Failed to get trending cryptos: ${error.message}`
        };
    }
}

export async function searchNftCollection(collection_name, auth) {
    try {
        const response = await backend.get(`${API_BACKEND_URL}/tools/search-nft-collection/${collection_name}`, {
            headers: {
                Authorization: `Bearer ${auth}`,
                'Content-Type': 'application/json' 
            },
            timeout: 30000
        });

        return response.data;
    } catch (error) {
        console.error('Error in searchNftCollection:', error);
        return {
            error: true,
            message: `Failed to search NFT collection: ${error.message}`
        };
    }
}

export async function searchTrendingNFT(period, trending_by, limit, auth) {
    try {
        const response = await backend.get(`${API_BACKEND_URL}/tools/search-trending-nft`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            params: { period, trending_by, limit }
        });

        return response.data;
    } catch (error) {
        console.error('Error in searchTrendingNFT:', error);
        return {
            error: true,
            message: `Failed to search trending NFTs: ${error.message}`
        };
    }
}

export async function createSoundEffect(text, duration_seconds, prompt_influence, auth) {
    try {
        console.log('Creating sound effect with params:', { text, duration_seconds, prompt_influence });
        
        const result = await backend.post(`${API_BACKEND_URL}/tools/create-sound-effect`, {
            text, duration_seconds, prompt_influence 
        },
        {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}`},
            timeout: 60000
        });

        if (!result.data.url) {
            throw new Error('No sound effect URL returned from generation');
        }

        return {
            content: `[Sound Effect: ${text}](${result.data.url})`,
            duration_seconds,
            text
        };
    } catch (error) {
        console.error('Error in createSoundEffect:', error);
        return {
            error: true,
            message: `Failed to create sound effect: ${error.message}`
        };
    }
}

export async function fetchUserNFTCollections(auth) {
    try {
        const response = await backend.post(`${API_BACKEND_URL}/tools/fetch-user-nft-collections`, {}, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}` 
            },
            timeout: 30000
        });

        return response.data;
    } catch (error) {
        console.error('Error in fetchUserNFTCollections:', error);
        return {
            error: true,
            message: `Failed to fetch user NFT collections: ${error.message}`
        };
    }
}