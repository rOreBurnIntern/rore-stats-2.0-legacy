import { logError } from './log';
import { parseMotherlodeData, parseMotherlodeHistory, type MotherlodeHistoryPoint, type MotherlodeApiResponse } from './motherlode';

export interface StatsData {
  wethPrice: number;
  rorePrice: number;
  blockPerformance?: {
    block: number;
    wins: number;
  }[];
  winnerTypes?: {
    winnerTakeAll: number;
    split: number;
  };
  motherlode: {
    totalValue: number;
    totalORELocked: number;
    participants: number;
    history?: MotherlodeHistoryPoint[];
  };
  currentRound: {
    number: number;
    status: string;
    prize: number;
    entries: number;
    endTime: number;
  };
  lastUpdated: number;
}

interface PricesApiResponse {
  weth: number;
  rore: number;
}

interface CurrentRoundApiResponse {
  round: number;
  status: string;
  prize: number;
  entries: number;
  endTime: number;
}

const PRICES_API_URL = 'https://api.rore.supply/api/prices';
const MOTHERLODE_API_URL = 'https://api.rore.supply/api/motherlode';
const ROUND_API_URL = 'https://api.rore.supply/api/rounds/current';
const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
const WINNER_TAKE_ALL_KEYS = [
  'winnerTakeAll',
  'winner_take_all',
  'winnerTakeAllCount',
  'winner_take_all_count',
  'winnerTakeAllRounds',
  'winner_take_all_rounds',
  'winnerTakeAllWins',
  'winner_take_all_wins',
  'takeAll',
  'take_all',
  'wta',
];
const SPLIT_KEYS = ['split', 'splitCount', 'split_count', 'splitRounds', 'split_rounds', 'splitWins', 'split_wins'];
const WINNER_TYPE_CONTAINER_KEYS = [
  'winnerTypes',
  'winnerTypeCounts',
  'winnerTypeSummary',
  'winnerTypeBreakdown',
  'winner_types',
];
const WINNER_TYPE_LABEL_KEYS = ['type', 'name', 'label', 'key'];
const WINNER_TYPE_VALUE_KEYS = ['count', 'value', 'total', 'rounds', 'wins'];
const BLOCK_PERFORMANCE_KEYS = [
  'blockPerformance',
  'winsPerBlock',
  'blockWins',
  'blockWinCounts',
  'blockBreakdown',
];
const BLOCK_LABEL_KEYS = ['block', 'blockNumber', 'winningBlock', 'winnerBlock', 'label', 'name', 'key'];
const ROUND_COLLECTION_KEYS = ['items', 'rounds', 'results', 'data'];
const REQUEST_INIT: RequestInit & { next: { revalidate: number } } = {
  headers: {
    Accept: 'application/json',
  },
  next: { revalidate: 30 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  throw new Error(`Invalid numeric field: ${key}`);
}

function readNumberFromKeys(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  throw new Error(`Invalid numeric fields: ${keys.join(', ')}`);
}

function readOptionalNumberFromKeys(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return null;
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  throw new Error(`Invalid string field: ${key}`);
}

function readOptionalStringFromKeys(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
}

function parseBlockNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 25) {
    return value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const directValue = Number(value);

  if (Number.isInteger(directValue) && directValue >= 1 && directValue <= 25) {
    return directValue;
  }

  const matchedValue = value.match(/\d+/);

  if (!matchedValue) {
    return null;
  }

  const parsedValue = Number(matchedValue[0]);
  return Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 25 ? parsedValue : null;
}

function readOptionalBlockFromKeys(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const parsedBlock = parseBlockNumber(source[key]);

    if (parsedBlock !== null) {
      return parsedBlock;
    }
  }

  return null;
}

function readOptionalNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
}

function addWinsByBlock(winsByBlock: Map<number, number>, block: number, wins: number) {
  winsByBlock.set(block, (winsByBlock.get(block) ?? 0) + Math.max(wins, 0));
}

function buildBlockPerformance(
  winsByBlock: Map<number, number>
): StatsData['blockPerformance'] | undefined {
  const totalWins = Array.from(winsByBlock.values()).reduce((sum, wins) => sum + wins, 0);

  if (totalWins <= 0) {
    return undefined;
  }

  return Array.from({ length: 25 }, (_, index) => ({
    block: index + 1,
    wins: winsByBlock.get(index + 1) ?? 0,
  }));
}

function parseBlockPerformanceRecord(
  source: Record<string, unknown>
): StatsData['blockPerformance'] | undefined {
  const winsByBlock = new Map<number, number>();

  for (const [key, value] of Object.entries(source)) {
    const block = parseBlockNumber(key);
    const wins = readOptionalNumericValue(value)
      ?? (isRecord(value) ? readOptionalNumberFromKeys(value, WINNER_TYPE_VALUE_KEYS) : null);

    if (block !== null && wins !== null) {
      addWinsByBlock(winsByBlock, block, wins);
    }
  }

  return buildBlockPerformance(winsByBlock);
}

function parseBlockPerformanceArray(
  source: unknown[]
): StatsData['blockPerformance'] | undefined {
  const winsByBlock = new Map<number, number>();

  for (const entry of source) {
    if (!isRecord(entry)) {
      continue;
    }

    const block = readOptionalBlockFromKeys(entry, BLOCK_LABEL_KEYS)
      ?? (isRecord(entry.winner) ? readOptionalBlockFromKeys(entry.winner, BLOCK_LABEL_KEYS) : null)
      ?? (isRecord(entry.result) ? readOptionalBlockFromKeys(entry.result, BLOCK_LABEL_KEYS) : null);

    if (block === null) {
      continue;
    }

    const wins = readOptionalNumberFromKeys(entry, WINNER_TYPE_VALUE_KEYS)
      ?? (isRecord(entry.winner) ? readOptionalNumberFromKeys(entry.winner, WINNER_TYPE_VALUE_KEYS) : null)
      ?? (isRecord(entry.result) ? readOptionalNumberFromKeys(entry.result, WINNER_TYPE_VALUE_KEYS) : null)
      ?? 1;

    addWinsByBlock(winsByBlock, block, wins);
  }

  return buildBlockPerformance(winsByBlock);
}

function parseBlockPerformance(payload: unknown): StatsData['blockPerformance'] | undefined {
  if (Array.isArray(payload)) {
    return parseBlockPerformanceArray(payload);
  }

  if (!isRecord(payload)) {
    return undefined;
  }

  for (const key of BLOCK_PERFORMANCE_KEYS) {
    const parsedBlockPerformance = parseBlockPerformance(payload[key]);

    if (parsedBlockPerformance) {
      return parsedBlockPerformance;
    }
  }

  for (const key of ROUND_COLLECTION_KEYS) {
    const parsedBlockPerformance = parseBlockPerformance(payload[key]);

    if (parsedBlockPerformance) {
      return parsedBlockPerformance;
    }
  }

  return parseBlockPerformanceRecord(payload);
}

function buildWinnerTypes(
  winnerTakeAll: number | null,
  split: number | null
): StatsData['winnerTypes'] | undefined {
  if (winnerTakeAll === null && split === null) {
    return undefined;
  }

  const normalizedWinnerTakeAll = Math.max(winnerTakeAll ?? 0, 0);
  const normalizedSplit = Math.max(split ?? 0, 0);

  if (normalizedWinnerTakeAll === 0 && normalizedSplit === 0) {
    return undefined;
  }

  return {
    winnerTakeAll: normalizedWinnerTakeAll,
    split: normalizedSplit,
  };
}

function normalizeWinnerType(value: string): 'winnerTakeAll' | 'split' | null {
  const normalizedValue = value.toLowerCase().replace(/[^a-z]/g, '');

  if (normalizedValue.includes('winnertakeall') || normalizedValue.includes('takeall') || normalizedValue === 'wta') {
    return 'winnerTakeAll';
  }

  if (normalizedValue.includes('split')) {
    return 'split';
  }

  return null;
}

function parseWinnerTypes(payload: unknown): StatsData['winnerTypes'] | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const directWinnerTypes = buildWinnerTypes(
    readOptionalNumberFromKeys(payload, WINNER_TAKE_ALL_KEYS),
    readOptionalNumberFromKeys(payload, SPLIT_KEYS)
  );

  if (directWinnerTypes) {
    return directWinnerTypes;
  }

  for (const key of WINNER_TYPE_CONTAINER_KEYS) {
    const container = payload[key];

    if (Array.isArray(container)) {
      let winnerTakeAll: number | null = null;
      let split: number | null = null;

      for (const entry of container) {
        if (!isRecord(entry)) {
          continue;
        }

        const winnerType = readOptionalStringFromKeys(entry, WINNER_TYPE_LABEL_KEYS);
        const count = readOptionalNumberFromKeys(entry, WINNER_TYPE_VALUE_KEYS);

        if (!winnerType || count === null) {
          continue;
        }

        const normalizedWinnerType = normalizeWinnerType(winnerType);

        if (normalizedWinnerType === 'winnerTakeAll') {
          winnerTakeAll = count;
        }

        if (normalizedWinnerType === 'split') {
          split = count;
        }
      }

      const parsedWinnerTypes = buildWinnerTypes(winnerTakeAll, split);

      if (parsedWinnerTypes) {
        return parsedWinnerTypes;
      }

      continue;
    }

    if (isRecord(container)) {
      const parsedWinnerTypes = parseWinnerTypes(container);

      if (parsedWinnerTypes) {
        return parsedWinnerTypes;
      }
    }
  }

  return undefined;
}

function parsePricesData(payload: unknown): PricesApiResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid prices payload');
  }

  return {
    weth: readNumberFromKeys(payload, ['weth', 'usd']),
    rore: readNumberFromKeys(payload, ['rore', 'ore']),
  };
}

function parseCurrentRoundData(payload: unknown): CurrentRoundApiResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid round payload');
  }

  return {
    round: readNumber(payload, 'round'),
    status: readString(payload, 'status'),
    prize: readNumber(payload, 'prize'),
    entries: readNumber(payload, 'entries'),
    endTime: readNumber(payload, 'endTime'),
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, REQUEST_INIT);

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.json();
}

export async function getStatsData(): Promise<StatsData | null> {
  try {
    const [pricesPayload, motherlodePayload, currentRoundPayload] = await Promise.all([
      fetchJson(PRICES_API_URL),
      fetchJson(MOTHERLODE_API_URL),
      fetchJson(ROUND_API_URL),
    ]);
    const pricesData = parsePricesData(pricesPayload);
    const currentRoundData = parseCurrentRoundData(currentRoundPayload);
    const blockPerformance = parseBlockPerformance(currentRoundPayload) ?? parseBlockPerformance(motherlodePayload);
    const winnerTypes = parseWinnerTypes(currentRoundPayload);
    const motherlodeData = parseMotherlodeData(motherlodePayload, currentRoundPayload);
    const motherlodeHistory = parseMotherlodeHistory(
      motherlodePayload,
      currentRoundPayload,
      motherlodeData.totalValue
    );
    const motherlode = motherlodeHistory.length > 0
      ? { ...motherlodeData, history: motherlodeHistory }
      : motherlodeData;

    return {
      wethPrice: pricesData.weth,
      rorePrice: pricesData.rore,
      ...(blockPerformance ? { blockPerformance } : {}),
      ...(winnerTypes ? { winnerTypes } : {}),
      motherlode,
      currentRound: {
        number: currentRoundData.round,
        status: currentRoundData.status,
        prize: currentRoundData.prize,
        entries: currentRoundData.entries,
        endTime: currentRoundData.endTime,
      },
      lastUpdated: Date.now(),
    };
  } catch (error) {
    logError('Failed to aggregate stats from rORE API', error, {
      route: '/api/stats',
      upstreamUrls: [PRICES_API_URL, MOTHERLODE_API_URL, ROUND_API_URL],
    });
    return null;
  }
}
