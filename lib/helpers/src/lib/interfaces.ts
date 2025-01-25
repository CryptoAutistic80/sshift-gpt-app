import { QuoteSummaryResult } from 'yahoo-finance2/dist/esm/src/modules/quoteSummary-iface';
import { RecommendationsBySymbolResponse } from 'yahoo-finance2/dist/esm/src/modules/recommendationsBySymbol';
import { MultisignAction } from './enums';

export interface IAuth {
  message: string;
  address: string;
  publicKey: string;
  signature: string;
}

export interface IJwt {
  authToken: string;
}

export interface IChatHistory {
  role: string;
  content: string;
}

export interface IChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface IChat {
  id: string;
  model: string;
  system_fingerprint: string;
  message_history: IChatHistory[];
  usage: IChatUsage;
}

export interface IUserAuth {
  auth: string;
  address: string;
  config: IUserConfig;
}

export interface ICollectionAddressDiscount {
  collection_addr: `0x${string}`;
  discount_per_day: number;
}

export interface ISubscription {
  prices: number[];
  max_days: number;
  collections_discount: ICollectionAddressDiscount[];
  token_creator: string;
  token_collection: string;
  token_name: string;
  token_property_version: number;
}

export interface IMoveBotFields {
  token_creator: string;
  token_collection: string;
  token_name: string;
  token_property_version: number;
}

export interface INft {
  name?: string;
  id: string;
  tokens: string[];
  src?: string;
  amount?: number;
  toBurn: boolean;
}

export interface Token {
  token_name: string;
  cdn_asset_uris: {
    cdn_image_uri: string;
    asset_uri: string;
  };
}

export interface ICoins {
  amount: any;
  asset_type: string;
  is_frozen: boolean;
  is_primary: boolean;
  last_transaction_timestamp: any;
  last_transaction_version: any;
  owner_address: string;
  storage_id: string;
  token_standard: string;
  metadata?: {
    token_standard: string;
    symbol: string;
    supply_aggregator_table_key_v1?: string | null;
    supply_aggregator_table_handle_v1?: string | null;
    project_uri?: string | null;
    name: string;
    last_transaction_version: any;
    last_transaction_timestamp: any;
    icon_uri?: string | null;
    decimals: number;
    creator_address: string;
    asset_type: string;
  } | null;
}

export interface ICollection {
  creator_address: string;
  collection_id: string;
  collection_name: string;
  current_supply: number;
  max_supply: number;
  uri: string;
  description: string;
  cdn_asset_uris: {
    cdn_animation_uri: string;
    cdn_image_uri: string;
  };
}

export interface ICollectionQueryResult {
  start_date: string;
  end_date: string;
  current_collections_v2: Array<ICollection>;
  current_collection_ownership_v2_view: {
    owner_address: string;
  };
  current_collection_ownership_v2_view_aggregate: {
    aggregate: {
      count: number;
    };
  };
  current_token_datas_v2: Array<Token>;
}

export interface ICollectionData {
  collection: ICollection;
}

export interface ICollectionRequired {
  collection_addr: string;
  amount: number | string;
}

export interface IConfigSetting {
  fees: string;
  nfts_required: ICollectionRequired[];
}

export interface IFeatureActivity {
  name: string;
  creditsUsed: number;
}

export interface ISubscriptionPlan {
  active: boolean;
  startDate?: number;
  endDate?: number;
  modelsUsed: IFeatureActivity[];
  toolsUsed: IFeatureActivity[];
}

export interface IUserConfig {
  subscriptionPlan: ISubscriptionPlan;
  isAdmin: boolean;
  isReviewer: boolean;
  isCollector: boolean;
}

export interface ICredits {
  name: string;
  credits: number;
}

export interface IAdminConfig {
  models: ICredits[];
  tools: ICredits[];
}

export interface IAction {
  action: MultisignAction;
  transaction: string;
  targetAddress: `0x${string}`;
  signature: string;
}

// NFT Collection Interfaces
export interface INFTCollection {
  id: string;
  slug: string;
  title: string;
  cover_url: string;
  floor: number;
  verified: boolean;
  volume: number;
  description?: string;
  creator?: string;
  supply?: number;
  minted?: number;
  traits?: INFTTrait[];
  items?: INFTItem[];
}

export interface INFTTrait {
  name: string;
  value: string;
  rarity?: number;
}

export interface INFTItem {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  traits?: INFTTrait[];
  owner?: string;
  last_price?: number;
  last_sale_date?: string;
}

export interface ISubscriptionToClaim {
  account: string;
  duration: number;
}

export interface IImage {
  prompt: string;
  url: string;
}

export interface ISoundEffect {
  url: string;
  duration_seconds: string | number;
  text: string;
  prompt: string;
  description: string;
}

export interface ICollection {
  id: string;
  slug: string;
  title: string;
  cover_url: string;
  floor: number;
  verified: boolean;
  volume: number;
}

export interface ICmcInfo {
  market_cap: number;
  current_price: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
  undiluted_market_cap: number;
  description: string;
  logo: string;
  urls: unknown;
  exchanges: string[];
}

export interface ISplit {
  date: Date;
  split: string;
}

export interface IDividend {
  date: Date;
  dividend: number;
}

export interface IFinancial {
  financialData: QuoteSummaryResult['financialData'];
  incomeStatement: QuoteSummaryResult['incomeStatementHistory'];
}

export interface ITicker {
  current_price: number;
  splits: object;
  dividends: object;
  company_info: QuoteSummaryResult['price'] &
    QuoteSummaryResult['summaryProfile'] &
    QuoteSummaryResult['summaryDetail'];
  financials: IFinancial;
  recommendations: RecommendationsBySymbolResponse;
}

export interface IJWTUser {
  account: string;
  token: string;
}
