import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nest-modules';

@Injectable()
export class AgentService {
  private logger = new Logger(AgentService.name);

  constructor(
    private httpService: HttpService,
    private readonly configService: ConfigService
  ) {}
  async generateImage(prompt, size, style, auth, signal) {
    try {
      this.logger.log('Generating image with params:', { prompt, size, style });

      const result = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/generate-image`,
          {
            prompt,
            size,
            style,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 120000,
            signal,
          }
        )
      );

      if (!result.data.url) {
        throw new Error('No image URL returned from generation');
      }

      return {
        url: result.data.url,
        prompt,
      };
    } catch (error) {
      console.error('Error in generateImage:', error);
      return {
        error: true,
        message: `Failed to generate image: ${error.message}`,
      };
    }
  }

  async searchWeb(query, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('serverToolsApi.uri')}/tools/search-web`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { query },
            timeout: 60000,
            signal,
          }
        )
      );

      const data = response.data;
      if (data && data.result && Array.isArray(data.citations) && data.citations.length > 0) {
        data.result = data.result.replace(/\[(\d+)\]/g, (match, p1) => {
          const index = parseInt(p1, 10);
          if (index >= 1 && index <= data.citations.length) {
            return `[${index}](${data.citations[index - 1]})`;
          }
          return match;
        });
      }
      return data;
    } catch (error) {
      console.error('Error in searchWeb:', error);
      return {
        error: true,
        message: `Failed to search web: ${error.message}`,
      };
    }
  }

  async wikiSearch(action, searchString, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('serverToolsApi.uri')}/tools/wiki-search`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { action, searchString },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in wikiSearch:', error);
      return {
        error: true,
        message: `Failed to search Wikipedia: ${error.message}`,
      };
    }
  }

  async getStockInfo(tickers, info_types, auth, signal) {
    try {
      const result = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/get-stock-info`,
          {
            tickers,
            info_types,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return result.data;
    } catch (error) {
      console.error('Error in getStockInfo:', error);
      return {
        error: true,
        message: `Failed to get stock info: ${error.message}`,
      };
    }
  }

  async getCryptoInfoFromCMC(token_symbol, auth, signal) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/get-crypto-info-from-cmd/${token_symbol}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return result.data;
    } catch (error) {
      return {
        error: true,
        message: `Failed to get crypto info from CoinMarketCap: ${error.message}`,
      };
    }
  }

  async queryArxiv(
    search_query,
    max_results,
    sort_by,
    sort_order,
    auth,
    signal
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('serverToolsApi.uri')}/tools/search-arxiv`,
          { search_query, max_results, sort_by, sort_order },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in queryArxiv:', error);
      return {
        error: true,
        message: `Failed to query arXiv: ${error.message}`,
      };
    }
  }

  async getTrendingCryptos(option, limit = 10, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/get-trending-cryptos/${option}`,
          {
            params: { limit },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in getTrendingCryptos:', error);
      return {
        error: true,
        message: `Failed to get trending cryptos: ${error.message}`,
      };
    }
  }

  async searchNftCollection(collection_name, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/search-nft-collection/${collection_name}`,
          {
            headers: {
              Authorization: `Bearer ${auth}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in searchNftCollection:', error);
      return {
        error: true,
        message: `Failed to search NFT collection: ${error.message}`,
      };
    }
  }

  async searchTrendingNFT(period, trending_by, limit, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/search-trending-nft`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { period, trending_by, limit },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in searchTrendingNFT:', error);
      return {
        error: true,
        message: `Failed to search trending NFTs: ${error.message}`,
      };
    }
  }

  async createSoundEffect(
    text,
    duration_seconds,
    prompt_influence,
    auth,
    signal
  ) {
    try {
      this.logger.log('Creating sound effect with params:', {
        text,
        duration_seconds,
        prompt_influence,
      });

      const result = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/create-sound-effect`,
          {
            text,
            duration_seconds,
            prompt_influence,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 120000,
            signal,
          }
        )
      );

      if (!result.data.url) {
        throw new Error('No sound effect URL returned from generation');
      }

      return {
        content: `[Sound Effect: ${text}](${result.data.url})`,
        duration_seconds,
        text,
      };
    } catch (error) {
      console.error('Error in createSoundEffect:', error);
      return {
        error: true,
        message: `Failed to create sound effect: ${error.message}`,
      };
    }
  }

  async fetchUserNFTCollections(auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/tools/fetch-user-nft-collections`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in fetchUserNFTCollections:', error);
      return {
        error: true,
        message: `Failed to fetch user NFT collections: ${error.message}`,
      };
    }
  }

  async getAllTopics(date, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/handle-finder/topics`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { date },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in getAllTopics:', error);
      return {
        error: true,
        message: 'Failed to fetch all topics',
      };
    }
  }

  async getTokenStats(limit, page, auth, signal) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/handle-finder/tokens/stats`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            params: { limit, page },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in getTokensMentioned:', error);
      return {
        error: true,
        message: 'Failed to fetch tokens mentioned',
      };
    }
  }

  async getTrendingUsers(page, limit, ratio, protocol, auth, signal) {
    const query = { page, limit, ratio, protocol };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get(
            'serverToolsApi.uri'
          )}/handle-finder/trending/users`,
          query,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`,
            },
            timeout: 30000,
            signal,
          }
        )
      );

      return response.data;
    } catch (error) {
      console.error('Error in getTrendingUsers:', error);
      return {
        error: true,
        message: 'Failed to fetch trending users',
      };
    }
  }
}
