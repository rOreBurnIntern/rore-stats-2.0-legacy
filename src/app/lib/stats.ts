import { logError } from './log';
import type { MotherlodeHistoryPoint } from './motherlode';

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

const PRICES_API_URL = 'https://api.rore.supply/api/prices';
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePrizeAmount(raw: unknown): number {
  if (typeof raw === 'number') {
    return raw;
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);

      if (isRecord(parsed) && parsed.amount !== undefined) {
        return Number(parsed.amount) || 0;
      }
    } catch {
      // Fall through to direct parse.
    }

    return Number(raw) || 0;
  }

  return 0;
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

function readOptionalNumber(source: Record<string, unknown>, key: string): number | null {
  if (!(key in source)) {
    return null;
  }

  const value = source[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  return readNumber(source, key);
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
    const value = readOptionalNumber(source, key);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function convertWeiToDecimal(value: string): number {
  const normalizedValue = value.replace(/^0+/, '') || '0';
  const wholeDigits = normalizedValue.length > 18 ? normalizedValue.slice(0, -18) : '0';
  const fractionalDigits = normalizedValue
    .slice(-18)
    .padStart(18, '0')
    .replace(/0+$/, '');
  const decimalValue = fractionalDigits ? `${wholeDigits}.${fractionalDigits}` : wholeDigits;
  const parsedValue = Number(decimalValue);

  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  throw new Error('Invalid wei value: motherlode');
}

function readMotherlodeAmount(source: Record<string, unknown>, key: string): number | null {
  if (!(key in source)) {
    return null;
  }

  const value = source[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid numeric field: ${key}`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue === '') {
    return null;
  }

  if (/^\d+$/.test(normalizedValue)) {
    return convertWeiToDecimal(normalizedValue);
  }

  const parsedValue = Number(normalizedValue);

  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  throw new Error(`Invalid numeric field: ${key}`);
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

function parseExploreData(payload: unknown): {
  motherlode: number;
  totalValue: number;
  participants: number;
  rounds: { roundId: number; status: string; prize: number; entries: number; endTime: number; }[];
  blockPerformance?: { block: number; wins: number; }[];
  winnerTypes?: { winnerTakeAll: number; split: number; };
} {
  if (!isRecord(payload)) {
    throw new Error('Invalid explore payload');
  }

  const payloadRecord = payload;
  const protocolStats = isRecord(payloadRecord.protocolStats) ? payloadRecord.protocolStats : null;

  // Parse protocolStats.motherlode (from wei to ORE)
  const motherlodeOracle = readMotherlodeAmount(payloadRecord, 'motherlode')
    ?? (protocolStats ? readMotherlodeAmount(protocolStats, 'motherlode') : null)
    ?? 0;

  // Get current round from roundsData[0]
  const roundsArray = Array.isArray(payloadRecord.roundsData)
    ? payloadRecord.roundsData
    : Array.isArray(payloadRecord.rounds)
      ? payloadRecord.rounds
      : [];
  const roundsList = roundsArray.map((round) => ({
    roundId: isRecord(round) ? (readOptionalNumber(round, 'roundId') ?? 0) : 0,
    status: isRecord(round) && typeof round.status === 'string' && round.status.trim() !== ''
      ? round.status
      : 'Unknown',
    prize: isRecord(round) ? parsePrizeAmount(round.prize) : 0,
    entries: isRecord(round) ? (readOptionalNumber(round, 'entries') ?? 0) : 0,
    endTime: isRecord(round) ? (readOptionalNumber(round, 'endTime') ?? Date.now()) : Date.now()
  }));

  // Parse block performance from protocolStats or roundsData
  const blockPerformance = parseBlockPerformance(payloadRecord.protocolStats || payloadRecord);
  
  // Parse winner types
  const winnerTypes = parseWinnerTypes(payloadRecord.protocolStats || payloadRecord);

  return {
    motherlode: motherlodeOracle,
    totalValue: protocolStats ? (readOptionalNumber(protocolStats, 'totalValue') ?? 0) : 0,
    participants: protocolStats ? (readOptionalNumber(protocolStats, 'participants') ?? 0) : 0,
    rounds: roundsList,
    blockPerformance,
    winnerTypes
  };
}

export async function getStatsData(): Promise<StatsData | null> {
  try {
    // Fetch prices
    const pricesData = await fetch(PRICES_API_URL, { signal: AbortSignal.timeout(5000) });
    if (!pricesData.ok) throw new Error(`Prices failed: ${pricesData.status}`);
    const pricesPayload = await pricesData.json();
    const parsedPrices = parsePricesData(pricesPayload);

    // Fetch explore data (contains motherlode and rounds)
    const exploreData = await fetch(EXPLORE_API_URL, { signal: AbortSignal.timeout(5000) });
    if (!exploreData.ok) throw new Error(`Explore failed: ${exploreData.status}`);
    const explorePayload = await exploreData.json();
    const exploreParsed = parseExploreData(explorePayload);

    // Get current round
    const currentRound = exploreParsed.rounds[0] || {
      roundId: 30710,
      status: 'Unknown',
      prize: 0,
      entries: 0,
      endTime: Date.now()
    };

    return {
      wethPrice: parsedPrices.weth,
      rorePrice: parsedPrices.rore,
      blockPerformance: exploreParsed.blockPerformance,
      winnerTypes: exploreParsed.winnerTypes,
      motherlode: {
        totalValue: exploreParsed.totalValue,
        totalORELocked: exploreParsed.motherlode,
        participants: exploreParsed.participants,
      },
      currentRound: {
        number: currentRound.roundId,
        status: currentRound.status,
        prize: currentRound.prize,
        entries: currentRound.entries,
        endTime: currentRound.endTime,
      },
      lastUpdated: Date.now(),
    };
  } catch (error) {
    logError('Failed to fetch stats', error, { route: '/api/stats' });
    return null;
  }
}

export default getStatsData;
