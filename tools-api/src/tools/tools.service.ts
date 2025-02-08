import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { ElevenLabsService } from './elevenlabs.service';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  COLLECTION_DETAILS_QUERY,
  COLLECTION_SEARCH_QUERY,
  COLLECTION_STATS_QUERY,
  TRENDING_COLLECTIONS_QUERY,
  WALLET_COLLECTIONS_QUERY,
  BucketService,
  ConfigService,
} from '@nest-modules';
import {
  actions,
  ICmcInfo,
  ICollection,
  IImage,
  ISoundEffect,
  ITicker,
  transformCoverUrl,
  TrendingOptions,
} from '@helpers';
import { CreateSoundEffectDto } from './dto/create-sound-efect.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { OpenAI } from 'openai';
import { CMCService } from './coin-market-cap.service';
import yahooFinance from 'yahoo-finance2';
import { ChartOptionsWithReturnObject } from 'yahoo-finance2/dist/esm/src/modules/chart';
import { StockInfoDto } from './dto/stockInfo.dto';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import xml2js from 'xml2js';
import { SearchArxivDto } from './dto/search-arxiv.dto';

@Injectable()
export class ToolsService {
  private logger = new Logger(ToolsService.name);
  constructor(
    private readonly elevenLabsService: ElevenLabsService,
    private readonly storage: Storage,
    private readonly openApi: OpenAI,
    private readonly indexer: ApolloClient<NormalizedCacheObject>,
    private readonly bucketService: BucketService,
    private readonly cmcService: CMCService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async createSoundEffect(
    createSoundEffectDto: CreateSoundEffectDto
  ): Promise<ISoundEffect> {
    const { text, prompt_influence } = createSoundEffectDto;
    this.logger.log('Generating sound effect with prompt:', text);

    let { duration_seconds } = createSoundEffectDto;

    // Validate duration within schema constraints (1-20 seconds)
    if (!duration_seconds || duration_seconds < 1 || duration_seconds > 20) {
      duration_seconds = 10; // Default to 10 seconds if invalid
    }

    // Validate prompt_influence within schema constraints (0-1)
    const validatedPromptInfluence = Math.max(0, Math.min(1, prompt_influence));

    // Generate sound effect
    const audioBuffer = await this.elevenLabsService.generateSoundEffect(
      text,
      duration_seconds,
      validatedPromptInfluence
    );

    // Create a sanitized filename from the text
    const sanitizedText = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 50);

    const filename = `${sanitizedText}-${uuidv4()}.mp3`;
    const bucketName = 'sshift-gpt-bucket';

    const bucket = this.storage.bucket(bucketName);
    const blob = bucket.file(filename);

    // Set up the upload with proper metadata
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
        prompt: text,
      },
    });

    const soundEffect = (await new Promise((resolve, reject) => {
      // Handle upload errors
      blobStream.on('error', (err) => {
        this.logger.error('Upload error:', err);
        reject({
          error: 'Failed to upload sound effect',
          details: err.message,
        });
      });

      // Handle upload success
      blobStream.on('finish', () => {
        try {
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

          this.logger.log('Upload successful:', publicUrl);
          resolve({
            url: publicUrl,
            duration_seconds: duration_seconds || 'auto',
            text: text,
            prompt: text,
            description: `Sound effect generated using the prompt: "${text}"`,
          });
        } catch (error) {
          this.logger.error('Error getting public URL:', error);
          reject({ error: 'Failed to get public URL', details: error.message });
        }
      });

      // Write the buffer to the upload stream
      blobStream.end(Buffer.from(audioBuffer));
    })) as ISoundEffect;

    this.logger.log('Sound effect created:', soundEffect);

    return soundEffect;
  }

  async fetchWalletItemsCollections(address: string): Promise<ICollection[]> {
    const { data } = await this.indexer.query({
      query: WALLET_COLLECTIONS_QUERY,
      variables: {
        where: {
          nfts: {
            _or: [{ owner: { _eq: address } }],
          },
        },
        order_by: [{ volume: 'desc' }],
      },
    });

    const collections = data?.aptos?.collections || [];
    return collections.map((collection) => ({
      ...collection,
      floor: collection.floor * Math.pow(10, -8), // Convert to APT
      volume: collection.volume * Math.pow(10, -8), // Convert to APT
      cover_url: transformCoverUrl(collection.cover_url),
    }));
  }
  async generateImage(generateImageDto: GenerateImageDto): Promise<IImage> {
    const { prompt, size, style } = generateImageDto;

    this.logger.log('Generating image with prompt:', prompt);
    this.logger.log('Size:', size);
    this.logger.log('Style:', style);

    const response = await this.openApi.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1, // Hardcoded to 1 image only
      size: size,
      style: style,
      response_format: 'url',
    });

    this.logger.log('OpenAI API response:', JSON.stringify(response, null, 2));

    if (!response.data || response.data.length === 0) {
      throw new Error('No image generated');
    }

    const imageUrl = response.data[0].url;

    this.logger.log('Image generated successfully:', imageUrl);

    const bucketUrl = await this.bucketService.uploadImageToBucket(imageUrl);

    this.logger.log('Image uploaded to bucket:', bucketUrl);

    return {
      url: bucketUrl.url,
      prompt,
    };
  }

  async findCryptoInfoFromCMC(tokenSymbol: string): Promise<ICmcInfo> {
    return await this.cmcService.getFullCryptoInfo(tokenSymbol);
  }

  async getStockInfo(stockInfoDto: StockInfoDto) {
    const { tickers, info_types } = stockInfoDto;

    const result = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const tickerResult = {} as ITicker;

          for (const infoType of info_types) {
            switch (infoType) {
              case 'current_price': {
                const quote = await yahooFinance.quote(ticker);
                tickerResult.current_price = quote?.regularMarketPrice;
                break;
              }
              case 'splits': {
                const chartOptions: ChartOptionsWithReturnObject = {
                  period1: '1970-01-01',
                  interval: '1d',
                  events: 'splits',
                  return: 'object',
                };
                const chartData = await yahooFinance.chart(
                  ticker,
                  chartOptions
                );

                tickerResult.splits = chartData.events?.splits;
                break;
              }
              case 'dividends': {
                const divChartOptions: ChartOptionsWithReturnObject = {
                  period1: '1970-01-01',
                  interval: '1d',
                  events: 'dividends',
                  return: 'object',
                };
                const divData = await yahooFinance.chart(
                  ticker,
                  divChartOptions
                );
                tickerResult.dividends = divData.events?.dividends;
                break;
              }
              case 'company_info': {
                const quoteSummary = await yahooFinance.quoteSummary(ticker);
                tickerResult.company_info = {
                  ...quoteSummary.price,
                  ...quoteSummary.summaryProfile,
                  ...quoteSummary.summaryDetail,
                };
                break;
              }
              case 'financials': {
                const financials = await yahooFinance.quoteSummary(ticker, {
                  modules: ['financialData', 'incomeStatementHistory'],
                });
                tickerResult.financials = {
                  financialData: financials.financialData,
                  incomeStatement: financials.incomeStatementHistory,
                };
                break;
              }
              case 'recommendations': {
                const recommendations =
                  await yahooFinance.recommendationsBySymbol(ticker);
                tickerResult.recommendations = recommendations;
                break;
              }
            }
          }
          return tickerResult;
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          result[ticker] = { error: error.message };
        }
      })
    );

    this.logger.log('Stock info fetched successfully:', result);

    return result;
  }

  async getTrendingCryptos(option: TrendingOptions, limit = 10) {
    limit = Math.min(Math.max(1, limit), 250);

    let url;

    switch (option) {
      case TrendingOptions.popularity:
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=gecko_desc&per_page=${limit}&page=1`;
        break;
      case TrendingOptions.topGainers:
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=${limit}&page=1`;
        break;
      case TrendingOptions.marketCap:
        url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`;
        break;
      default:
        throw new Error(
          'Invalid option provided. Please use "popularity", "top_gainers", or "market_cap".'
        );
    }

    const response = await firstValueFrom(this.httpService.get(url));

    const data = await response.data;

    const trendingList = data.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.market_cap_rank,
      ...(option === 'top_gainers' && {
        price_change_percentage_24h: coin.price_change_percentage_24h,
      }),
    }));

    this.logger.log('Trending cryptos fetched successfully:', trendingList);

    return trendingList;
  }

  async searchNFTCollection(collectionName: string) {
    try {
      // Initial collection search
      const { data: searchData } = await this.indexer.query({
        query: COLLECTION_SEARCH_QUERY,
        variables: {
          text: collectionName,
          offset: 0,
          limit: 5,
        },
      });

      // Normalize the search term
      const searchTerm = collectionName
        .toLowerCase()
        .replace(/^the\s+/i, '')
        .replace(/\s+/g, '-')
        .trim();

      // Find the first matching verified collection
      const foundCollection = searchData.aptos.collections.find((c) => {
        if (!c.verified) return false;

        const normalizedTitle = c.title
          .toLowerCase()
          .replace(/^the\s+/i, '')
          .trim();

        const normalizedSlug = (c.semantic_slug || '')
          .toLowerCase()
          .replace(/^the-/i, '')
          .trim();

        return (
          normalizedTitle.includes(searchTerm) ||
          searchTerm.includes(normalizedTitle) ||
          normalizedSlug.includes(searchTerm) ||
          searchTerm.includes(normalizedSlug)
        );
      });

      if (!foundCollection) {
        return {
          status: 'not_found',
          message: `No verified collection found matching "${collectionName}". Please check the collection name and try again.`,
          search_term: collectionName,
        };
      }

      // Create a mutable copy of the collection with converted values
      const collection = {
        ...foundCollection,
        floor: foundCollection.floor * Math.pow(10, -8), // Convert to APT
        volume: foundCollection.volume * Math.pow(10, -8), // Convert to APT
      };

      // Fetch stats and details in parallel
      const [statsResult, detailsResult] = await Promise.all([
        this.indexer.query({
          query: COLLECTION_STATS_QUERY,
          variables: {
            slug: collection.slug,
          },
        }),
        this.indexer.query({
          query: COLLECTION_DETAILS_QUERY,
          variables: {
            slug: collection.slug,
          },
        }),
      ]);

      const stats = statsResult.data.aptos.collection_stats;
      const details = detailsResult.data.aptos.collections[0] || {};

      // Add stats to collection object
      collection.stats = {
        total_sales: stats.total_sales,
        day_sales: stats.day_sales,
        day_volume: stats.day_volume * Math.pow(10, -8),
        day_usd_volume: stats.day_usd_volume,
      };

      // Add details to collection object
      collection.details = {
        description: details.description || '',
        discord: details.discord || '',
        twitter: details.twitter || '',
        website: details.website || '',
      };

      // Add formatted fields
      collection.formatted = {
        title: collection.title,
        floor_price: `${collection.floor} APT`,
        total_volume: `${collection.volume} APT`,
        usd_volume: `$${collection.usd_volume.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        supply: `${collection.supply} NFTs`,
        verified: collection.verified,
        cover_url: transformCoverUrl(collection.cover_url),

        total_sales: `${stats.total_sales || 0} sales`,
        total_mints: `${stats.total_mints || 0} mints`,
        total_mint_volume: `${
          (stats.total_mint_volume || 0) * Math.pow(10, -8)
        } APT`,
        total_mint_usd_volume: `$${(
          stats.total_mint_usd_volume || 0
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,

        day_stats: {
          volume: `${collection.stats.day_volume} APT`,
          sales: collection.stats.day_sales,
          usd_volume: `$${collection.stats.day_usd_volume.toLocaleString(
            undefined,
            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          )}`,
        },

        social_links: {
          discord: details.discord || 'Not available',
          twitter: details.twitter || 'Not available',
          website: details.website || 'Not available',
        },

        description: details.description || 'No description available',
        slug: collection.slug,
        semantic_slug: collection.semantic_slug,

        marketplaces: {
          tradeport: `https://www.tradeport.xyz/aptos/collection/${collection.semantic_slug}?bottomTab=trades&tab=items`,
          wapal: `https://wapal.io/collection/${collection.title.replace(
            /\s+/g,
            '-'
          )}`,
        },
      };

      this.logger.log('NFT collection fetched successfully:', collection);

      return {
        status: 'found',
        data: collection,
      };
    } catch (error) {
      console.error('Failed to search NFT collection:', error);
      return {
        status: 'error',
        message: 'Failed to search NFT collection. Please try again later.',
        error: error.message,
      };
    }
  }

  async searchTrendingNFT({
    period = 'days_1',
    trendingBy = 'crypto_volume',
    limit = 10,
  }) {
    const allowedLimits = [5, 10, 20, 40];
    if (!allowedLimits.includes(limit)) {
      return {
        status: 'error',
        message: 'Invalid limit parameter. Allowed values are: 5, 10, 20, 40',
      };
    }

    const { data, error } = await this.indexer.query({
      query: TRENDING_COLLECTIONS_QUERY,
      variables: {
        period,
        trending_by: trendingBy,
        limit,
        offset: 0,
      },
    });

    if (error) {
      throw new Error(`GraphQL Error: ${error.message}`);
    }

    const trendingCollections = data.aptos.collections_trending.map((item) => {
      const collection = item.collection;
      const floor = collection.floor * Math.pow(10, -8); // Convert to APT

      return {
        title: collection.title,
        floor_price: `${floor} APT`,
      };
    });

    this.logger.log('Trending collection', trendingCollections);

    return {
      status: 'success',
      period,
      trending_by: trendingBy,
      limit,
      data: trendingCollections,
    };
  }

  async searchWiki(action: string, searchString: string) {
    const url = this.configService.get<string>('wiki.url');

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            action: actions.some((a) => a === action) ? action : 'query',
            format: 'json',
            list: 'search',
            srsearch: searchString,
          },
        })
      );
      const data = await response.data;

      this.logger.log('Fetched data from Wikipedia API:', data);

      return data;
    } catch (error) {
      console.error('Error fetching data from Wikipedia API:', error);
      throw error;
    }
  }

  async searchWeb(query: string) {
    // Add current date information to date-sensitive queries
    const currentDate = new Date();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Explicitly add the current year to queries about recent events or news
    if (
      query.toLowerCase().includes('news') ||
      query.toLowerCase().includes('today') ||
      query.toLowerCase().includes('recent') ||
      query.toLowerCase().includes('latest')
    ) {
      const formattedDate = `${
        monthNames[currentDate.getMonth()]
      } ${currentDate.getFullYear()}`;
      query = `${query} in ${formattedDate}`;
    }

    this.logger.log('Modified search query:', query);

    const body = {
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'Be verbose, precise and accurate as possible, maximising the amount of information you can provide by giving a detailed and in-depth summary of each result or topic. Always prioritize the most recent information available and explicitly mention the current date/year in your responses.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 1000,
      temperature: 0.2,
      top_p: 0.9,
      return_citations: true,
      search_domain_filter: ['perplexity.ai'],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'day',
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1,
    };

    this.logger.log('Sending request to Perplexity API with query:', query);
    const response = await firstValueFrom(
      this.httpService.post(
        this.configService.get('perplexity.baseUrl'),
        body,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>(
              'perplexity.apiKey'
            )}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );
    this.logger.log('Perplexity API response status:', response.status);

    // Handle different error status codes
    switch (response.status) {
      case 524:
        return {
          error: true,
          message:
            "I apologize, but I'm having trouble accessing the latest information right now due to a timeout. This usually means the search service is temporarily overloaded. Please try your question again in a moment.",
        };
      case 429:
        return {
          error: true,
          message:
            "I apologize, but I've hit the rate limit for web searches. Please try again in a few minutes when the limit resets.",
        };
      case 401:
        return {
          error: true,
          message:
            "I apologize, but I'm having authentication issues with the search service. This is a technical problem on our end that needs to be fixed.",
        };
    }

    const data = await response.data;
    this.logger.log('Perplexity API response data:', data);

    const responseDto = {
      error: false,
      result: data.choices && data.choices.length > 0 ? data.choices[0].message.content : '',
      message: data.message || '',
      citations: data.citations || []
    };
    return responseDto;
  }

  async queryArxiv(searchQueryDto: SearchArxivDto) {
    const baseUrl = this.configService.get<string>('arxiv.url');

    const { search_query, sort_order, max_results, sort_by } = searchQueryDto;

    // Ensure all required parameters have values
    const params = {
      search_query,
      start: 0,
      max_results: max_results || 10,
      sortBy: sort_by || 'submittedDate',
      sortOrder: sort_order || 'descending',
    };

    const response = await lastValueFrom(
      this.httpService.get(baseUrl, {
        params,
        responseType: 'text',
      })
    );
    const responseText = response.data;
    const responseDict = await xml2js.parseStringPromise(responseText);

    if (responseDict.feed && responseDict.feed.entry) {
      responseDict.feed.entry = responseDict.feed.entry.map((entry) => {
        // Format the date
        if (entry.published && entry.published[0]) {
          const publishDate = new Date(entry.published[0]);
          entry.publishedFormatted = publishDate.toLocaleDateString();
        }

        // Format the links as markdown
        if (entry.link) {
          entry.link = entry.link.map((link) => {
            // Convert link object to markdown format based on type
            if (link.$.title === 'pdf') {
              return `[PDF](${link.$.href})`;
            } else if (link.$.rel === 'alternate') {
              return `[Abstract](${link.$.href})`;
            }
            return link;
          });
        }

        return entry;
      });
    }

    this.logger.log('Fetched data from Arxiv API:', responseDict);

    return JSON.stringify(responseDict);
  }
}
