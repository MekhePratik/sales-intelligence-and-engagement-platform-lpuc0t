/**
 * search.service.ts
 *
 * This file implements the SearchService class and related functions for advanced lead search
 * operations in the B2B Sales Intelligence Platform. It utilizes PostgreSQL Full Text Search
 * for lead filtering, AI-based lead scoring with OpenAI, and Redis caching for performance
 * optimization. The service aligns with the system specifications, including the steps required
 * for query building, caching, scoring, pagination, and cache warming.
 */

// -------------------- External Imports (versioned) --------------------
// zod@^3.22.0 - Runtime validation for incoming search parameters
import { z } from 'zod';

// openai@^4.0.0 - AI-powered lead scoring functionalities
import { Configuration, OpenAIApi } from 'openai';

// -------------------- Internal Imports --------------------
import { DatabaseService } from '../config/database';
import { CacheService } from './cache.service';

// -------------------- Global Constants --------------------
/**
 * The default Time-to-Live (in seconds) for cached search results.
 * Adjust as needed to balance data freshness and performance.
 */
const SEARCH_CACHE_TTL = 300;

/**
 * The maximum number of leads to retrieve in a single search request,
 * preventing excessively large responses.
 */
const MAX_SEARCH_RESULTS = 100;

/**
 * Scoring weights that determine how relevance, engagement, and firmographic
 * data contribute to the final lead score.
 */
const SCORE_WEIGHTS = {
  relevance: 0.4,
  engagement: 0.3,
  firmographic: 0.3,
};

/**
 * If the cache hit ratio for certain queries drops below this threshold,
 * the system may opt to proactively warm the cache for popular search patterns.
 * This example is referenced in the warmCache method.
 */
const CACHE_WARM_THRESHOLD = 0.8;

// -------------------- Interfaces & Types --------------------
/**
 * Describes the shape of the search parameters object used to filter and
 * paginate leads. This structure is validated with Zod in the buildSearchQuery.
 */
export interface SearchParams {
  query?: string;
  industry?: string;
  companySize?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Defines optional scoring criteria that can be passed to fine-tune the
 * AI-based lead scoring logic, e.g., weighting certain fields. This illustration
 * is simplified; real usage might handle advanced parameters.
 */
export interface ScoringCriteria {
  additionalRelevance?: number;
  additionalEngagement?: number;
  [key: string]: unknown;
}

/**
 * Represents the structured query object that can be used with
 * a parameterized SQL execution in PostgreSQL.
 */
export interface QueryObject {
  text: string;
  values: any[];
}

/**
 * Represents each lead's core properties for demonstration, used
 * during AI-based scoring.
 */
export interface Lead {
  id: string;
  name?: string;
  email?: string;
  industry?: string;
  companySize?: string;
  lastEngagementScore?: number;
  [key: string]: any;
}

/**
 * Represents the result of a search operation, including
 * desired pagination and scoring fields.
 */
export interface SearchResult {
  data: Lead[];
  page: number;
  limit: number;
  total: number;
}

// -------------------- Zod Schema for SearchParams --------------------
/**
 * A Zod schema used to validate incoming search parameters.
 * This ensures that page and limit are integers, sort order is recognized,
 * and optional filters (industry, companySize) are sanitized.
 */
const searchParamsSchema = z.object({
  query: z.string().min(1).max(255).optional(),
  industry: z.string().min(1).max(255).optional(),
  companySize: z.string().min(1).max(255).optional(),
  page: z.number().int().min(1).default(1).optional(),
  limit: z.number().int().min(1).max(MAX_SEARCH_RESULTS).default(20).optional(),
  sortBy: z.string().min(1).max(255).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * A simple Zod schema for scoring options, though it is optional
 * in typical usage. This can be extended as needed.
 */
const scoringOptionsSchema = z.object({
  additionalRelevance: z.number().optional(),
  additionalEngagement: z.number().optional(),
});

// -------------------- Helper Functions --------------------
/**
 * buildSearchQuery
 * ----------------
 * Constructs an optimized PostgreSQL full-text search query with scoring and additional filters.
 * Follows these steps:
 *  1. Validate and sanitize search parameters.
 *  2. Build text search vector from relevant fields (e.g., name, email).
 *  3. Apply the weighting logic for relevance.
 *  4. Add company/industry filters if provided.
 *  5. Implement fuzzy matching for partial matches.
 *  6. Add pagination (limit/offset) and optional sorting.
 *  7. Return a parameterized query object (text + values).
 *
 * @param params        - The unvalidated SearchParams object
 * @param scoringOpts   - Scoring options that may alter the query weighting (optional)
 * @returns QueryObject - Contains the SQL text and array of parameter values
 */
export function buildSearchQuery(
  params: SearchParams,
  scoringOpts: ScoringCriteria = {},
): QueryObject {
  // Step 1: Validate parameters with Zod
  const validatedParams = searchParamsSchema.parse(params);
  const validatedScoring = scoringOptionsSchema.parse(scoringOpts);

  // Step 2: Extract parameters for convenience
  const {
    query,
    industry,
    companySize,
    page = 1,
    limit = 20,
    sortBy = 'score',
    sortOrder = 'desc',
  } = validatedParams;

  // Determine offset for pagination
  const offset = (page - 1) * limit;

  // Step 3: We'll build a text search clause using PostgreSQL's to_tsvector
  // and to_tsquery. For demonstration, we'll just match on "name" and "email"
  // columns. Fuzzy matching can be done with ILIKE or trigram extension if needed.
  // This example uses a simplistic approach.
  const conditions: string[] = [];
  const values: any[] = [];

  // Fuzzy match if query was provided
  if (query) {
    conditions.push(
      `(to_tsvector('english', COALESCE(name, '')) || to_tsvector('english', COALESCE(email, ''))) @@ to_tsquery($1)`,
    );
    // For basic fuzzy search, we might replace spaces with '&' or use plainto_tsquery
    values.push(query.trim().split(/\s+/).join(' & '));
  }

  // Step 4: Industry filter if specified
  if (industry) {
    conditions.push(`industry = $${values.length + 2}`);
    values.push(industry);
  }

  // Step 5: Company size filter if specified
  if (companySize) {
    conditions.push(`companySize = $${values.length + 2}`);
    values.push(companySize);
  }

  // Step 6: Compose the WHERE clause
  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(' AND ')}`;
  }

  // Step 7: Implement weighting logic in the SELECT with a dummy formula.
  // Real usage might incorporate ts_rank or custom ranking. We also incorporate
  // scoring options that might add dynamic weight. This example is simplified.
  const additionalRelevance = validatedScoring.additionalRelevance || 0;
  const additionalEngagement = validatedScoring.additionalEngagement || 0;

  // We'll define a naive "score" field as a sum of some placeholders
  // in actual usage, you'd use ts_rank or your custom weighting function.
  const selectScore = `
    (CASE
       WHEN $${values.length + 2} > 0 THEN $${values.length + 2}
       ELSE 0
     END)
     +
     (CASE
       WHEN $${values.length + 3} > 0 THEN $${values.length + 3}
       ELSE 0
     END)
     AS score
  `;
  values.push(additionalRelevance, additionalEngagement);

  // Step 8: Sorting and pagination
  // We'll default to ordering by "score DESC" unless user specified otherwise.
  const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
  const limitClause = `LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  // Step 9: Assemble the final SQL text
  const text = `
    SELECT
      id,
      name,
      email,
      industry,
      companySize,
      lastEngagementScore,
      ${selectScore}
    FROM leads
    ${whereClause}
    ${orderClause}
    ${limitClause}
  `;

  return { text, values };
}

/**
 * calculateLeadScore
 * ------------------
 * Calculates a lead's score using AI-based techniques and firmographic data. This includes:
 *  1. Extracting relevant attributes from the lead.
 *  2. Sending a prompt to OpenAI to get a base AI score.
 *  3. Weighting firmographic or engagement factors.
 *  4. Normalizing the final score between 0-100.
 *  5. Caching or storing the result if needed (demonstrative).
 *
 * @param lead      - The lead object with relevant fields (id, name, email, etc.)
 * @param criteria  - Additional scoring criteria that might adjust weighting
 * @param aiClient  - Instance of OpenAIApi for AI calls
 * @returns A Promise<number> representing the final lead score
 */
export async function calculateLeadScore(
  lead: Lead,
  criteria: ScoringCriteria,
  aiClient: OpenAIApi,
): Promise<number> {
  // Step 1: Extract relevant fields
  const { name, email, industry, lastEngagementScore = 0, companySize } = lead;

  // Step 2: Construct a prompt for the AI model
  // This is a simplified example of how you might incorporate GPT-based logic.
  const prompt = `
  Please analyze this lead data:

  - Name: ${name || 'N/A'}
  - Email: ${email || 'N/A'}
  - Industry: ${industry || 'N/A'}
  - Company Size: ${companySize || 'N/A'}
  - Last Engagement Score: ${lastEngagementScore}

  Then, using the following additional scoring criteria:
  ${JSON.stringify(criteria)}

  Return a single integer from 0 to 100 that represents the lead quality or likelihood to convert.
  `;

  // Step 3: Query OpenAI for an AI-based score (0-100). Real usage would parse carefully.
  let baseAiScore = 50; // fallback if OpenAI call fails
  try {
    const response = await aiClient.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.3,
    });
    const textOutput = response.data.choices[0]?.message?.content?.trim() || '50';
    const parsedNumber = parseInt(textOutput, 10);
    if (!Number.isNaN(parsedNumber)) {
      baseAiScore = parsedNumber;
    }
  } catch (error) {
    // If the AI call fails, we'll retain a default fallback
    // In production, you'd log this error in your monitoring system.
  }

  // Step 4: Weight firmographic and engagement data, applying global score weights
  const engagementFactor = (lastEngagementScore || 0) * SCORE_WEIGHTS.engagement;
  const firmographicFactor = 0.0;
  if (industry || companySize) {
    // For demonstration, lightly raise the score if we have data
    firmographicFactor += 5 * SCORE_WEIGHTS.firmographic;
  }

  // Step 5: Combine AI, engagement, and firmographic into a final 0-100 scale
  let finalScore =
    baseAiScore * SCORE_WEIGHTS.relevance + engagementFactor + firmographicFactor;

  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  // You might choose to cache the final score. For example:
  // await someCacheService.set(`lead-score:${lead.id}`, finalScore, 600);

  return finalScore;
}

// -------------------- Main Service Class --------------------
/**
 * SearchService
 * -------------
 * Provides enhanced lead search and scoring functionality. Incorporates:
 *  - Zod-based parameter validation
 *  - PostgreSQL FTS query building
 *  - AI-driven lead scoring
 *  - Redis caching for performance optimization
 *  - Cache warming strategies for commonly used queries
 */
export class SearchService {
  /**
   * The database service used for connecting and querying the PostgreSQL database.
   * Must provide getClient(operationType) as per the code in database.ts.
   */
  private dbService: DatabaseService;

  /**
   * The cache service used to store and retrieve query results, lowering response times.
   */
  private cacheService: CacheService;

  /**
   * The OpenAIApi client used for AI-based lead scoring. Configured in the constructor.
   */
  private aiClient: OpenAIApi;

  /**
   * Constructs the SearchService with necessary dependencies, sets up the AI client,
   * and configures any additional search settings or cache warming logic.
   *
   * @param dbService    - Instance of DatabaseService for DB operations
   * @param cacheService - Instance of CacheService for caching results
   */
  constructor(dbService: DatabaseService, cacheService: CacheService) {
    // Step 1: Initialize services
    this.dbService = dbService;
    this.cacheService = cacheService;

    // Step 2: Setup AI client from openai library
    // In production, you would retrieve the OpenAI API key from a secure location
    const openAiConfig = new Configuration({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-api-key',
    });
    this.aiClient = new OpenAIApi(openAiConfig);

    // Step 3: Configure any default search or scoring settings if needed
    // Step 4: Initialize cache warming or other performance strategies
  }

  /**
   * searchLeads
   * -----------
   * Performs an optimized lead search with scoring and caching.
   * Steps:
   *  1. Validate search parameters.
   *  2. Check cache for existing results (cache key derived from params).
   *  3. If miss, build and execute the query in the database.
   *  4. Apply AI-powered scoring to each lead.
   *  5. Cache the final result set with a TTL.
   *  6. Track performance metrics or logs.
   *  7. Return paginated results.
   *
   * @param params - The user-provided search parameters
   * @returns A Promise resolving to a SearchResult object
   */
  public async searchLeads(params: SearchParams): Promise<SearchResult> {
    try {
      // Step 1: Validate and build an appropriate cache key
      const validatedParams = searchParamsSchema.parse(params);
      const cacheKey = `lead-search:${JSON.stringify(validatedParams)}`;

      // Step 2: Attempt to retrieve from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached as SearchResult;
      }

      // Step 3: Build the query using the helper function
      const { text, values } = buildSearchQuery(validatedParams, {});

      // Step 4: Execute the query via DatabaseService. We read from a "read" replica if available.
      const client = this.dbService.getClient('read');
      const rows = await client.$queryRaw<Lead[]>(text, ...values);

      // Step 5: Apply AI-powered scoring to each lead
      const scoredLeads: Lead[] = [];
      for (const lead of rows) {
        const finalScore = await calculateLeadScore(lead, {}, this.aiClient);
        scoredLeads.push({
          ...lead,
          finalScore,
        });
      }

      // Step 6: Build a final result object including pagination info
      const page = validatedParams.page || 1;
      const limit = validatedParams.limit || 20;
      const data = scoredLeads;
      const total = data.length; // For demonstration, we didn't do a full count query

      const result: SearchResult = {
        data,
        page,
        limit,
        total,
      };

      // Step 7: Store the results in cache for future requests
      await this.cacheService.set(cacheKey, result, SEARCH_CACHE_TTL);

      // Step 8: Return the final search result
      return result;
    } catch (error) {
      // In production, we would log or transform this error with the platform's error handling
      throw error;
    }
  }

  /**
   * warmCache
   * ---------
   * Proactively warms the cache for common or high-value searches. Typical usage might be:
   *  1. Analyze search logs or patterns to identify top queries.
   *  2. Compute the cache hit ratio. If below CACHE_WARM_THRESHOLD, proceed.
   *  3. Execute queries in the background and store results in the cache.
   *  4. Update statistics about warmed queries.
   *  5. Provide a monitoring interface for cache coverage.
   *
   * @param strategy - An object or string that outlines how to choose queries to warm.
   * @returns A Promise<void> upon completion of the warming tasks.
   */
  public async warmCache(strategy: Record<string, any>): Promise<void> {
    // Step 1: Analyze search patterns. This is a stub example.
    // In real usage, you might retrieve a list of the top 10 frequent queries from a logs table.
    const popularQueries = [
      { query: 'director', page: 1, limit: 10 },
      { query: 'software', page: 1, limit: 10 },
    ];

    // Step 2: Evaluate the cache hit ratio or strategy data. A real approach might use metrics.
    const simulatedHitRatio = 0.75;
    if (simulatedHitRatio > CACHE_WARM_THRESHOLD) {
      // If we already have a decent ratio, do nothing
      return;
    }

    // Step 3: Execute background warming by forcibly calling searchLeads
    for (const q of popularQueries) {
      await this.searchLeads(q);
    }

    // Step 4: Update cache stats or logs
    // A real system might store statistics on warmed queries or update metrics
    // Step 5: Monitor the new ratio or produce logs
  }
}

// -------------------- Named Exports --------------------
/** 
 * As requested by the specification, these members are exposed for potential import.
 * The SearchService class methods (searchLeads and warmCache) are also available within the class.
 */
export { SearchService };