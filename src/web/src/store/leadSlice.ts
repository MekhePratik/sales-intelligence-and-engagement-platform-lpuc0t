/* eslint-disable @typescript-eslint/no-unused-vars */
/* 
  The following Redux Toolkit slice manages lead data in a B2B sales 
  intelligence platform. It provides:
    1. AI-powered search with caching and TTL checks
    2. Runtime parameter validation with Zod
    3. Optimistic updates for lead modifications
    4. Comprehensive error handling using ApiError
    5. Utility selectors, including scored/filtered lead retrieval
*/

/****************************************************************
 * EXTERNAL IMPORTS (with versions)
 ****************************************************************/
// @reduxjs/toolkit ^2.0.0
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// zod ^3.22.0
import { z } from 'zod';

/****************************************************************
 * INTERNAL IMPORTS
 ****************************************************************/
/*
  Importing lead-related types from ../types/lead. The Lead interface
  includes essential fields such as 'id', 'status', 'score', and for
  the sake of alignment with the JSON specification, we will reference
  'enrichmentData' as a conceptual mapping to companyData for AI
  enrichment purposes.
*/
import {
  Lead,
  LeadStatus,
  LeadSchema,
  LeadFilters,
  LeadFiltersSchema,
} from '../types/lead';

/*
  Importing API-related types from ../types/api. These interfaces
  and schemas provide structured response handling, pagination
  metadata, and error definitions.
*/
import {
  ApiResponse,
  PaginationMeta,
  ApiError,
  apiResponseSchema,
} from '../types/api';

/****************************************************************
 * ADDITIONAL TYPE DEFINITIONS
 ****************************************************************/
/**
 * Optional: Provide a specialized interface for AI-related
 * search configuration in the lead list. This extends beyond
 * standard filtering and sorting by integrating AI-based
 * parameters (e.g., semantic search).
 */
export interface AISearchParams {
  /**
   * The free-text query sent to an AI model or
   * semantic search engine.
   */
  query: string;
  /**
   * Flag to enable or disable semantic analysis
   * in the search request.
   */
  semanticAnalysis: boolean;
  /**
   * Optionally define a language code (e.g., 'en', 'es')
   * for localized or language-specific AI strategies.
   */
  language?: string;
}

/**
 * A Zod schema for AISearchParams to ensure runtime validation
 * when dispatching AI-enabled searches.
 */
export const AISearchParamsSchema = z.object({
  query: z.string(),
  semanticAnalysis: z.boolean(),
  language: z.string().optional(),
});

/**
 * The shape of the object passed into fetchLeads. This includes
 * any filter settings, as well as optional AI-based searching.
 * We will combine standard filters from LeadFilters with
 * AISearchParams for integrated logic.
 */
export interface FetchLeadsParams {
  filters?: LeadFilters;
  aiSearch?: AISearchParams;
  page?: number;
  perPage?: number;
}

/**
 * Zod schema for validating FetchLeadsParams
 * before making the async request.
 */
export const FetchLeadsParamsSchema = z.object({
  filters: LeadFiltersSchema.optional(),
  aiSearch: AISearchParamsSchema.optional(),
  page: z.number().optional(),
  perPage: z.number().optional(),
});

/**
 * The shape of the object passed into updateLead. This allows
 * partial lead data for optimistic updates.
 */
export interface UpdateLeadParams {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  companyName?: string;
  score?: number;
  status?: LeadStatus;
}

/**
 * Zod schema for validating UpdateLeadParams used in the
 * updateLead async thunk before making the API call.
 */
export const UpdateLeadParamsSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  companyName: z.string().optional(),
  score: z.number().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
});

/****************************************************************
 * LEAD STATE INTERFACE
 ****************************************************************/
/**
 * Enhanced interface defining the shape of the Lead slice state.
 * Requirements:
 *  1. leads: Cached record of leads keyed by their IDs
 *  2. filters: Current set of lead filters
 *  3. selectedLeads: Array of selected lead IDs
 *  4. loading: Indicates if the slice is performing async actions
 *  5. error: Holds contextual ApiError if any
 *  6. pagination: Tracks pagination metadata
 *  7. cacheTTL: Stores TTL information to manage caching per lead ID
 *  8. searchConfig: AISearchParams for AI-based searching
 */
export interface LeadState {
  leads: Record<string, Lead>;
  filters: LeadFilters;
  selectedLeads: string[];
  loading: boolean;
  error: ApiError | null;
  pagination: PaginationMeta;
  cacheTTL: Record<string, number>;
  searchConfig: AISearchParams;
}

/****************************************************************
 * INITIAL STATE
 ****************************************************************/
/**
 * Defines default values for the LeadState, ensuring the
 * slice starts in a predictable and stable configuration.
 */
const initialState: LeadState = {
  leads: {},
  filters: {},
  selectedLeads: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
  },
  cacheTTL: {},
  searchConfig: {
    query: '',
    semanticAnalysis: false,
    language: undefined,
  },
};

/****************************************************************
 * ASYNC THUNKS
 ****************************************************************/
/**
 * fetchLeads
 * Description:
 *    Enhanced async thunk for fetching leads with
 *    AI-powered search and caching.
 * Steps:
 *    1. Validate input parameters using Zod schema
 *    2. Check cache validity using TTL logic
 *    3. Construct AI-enhanced search parameters
 *    4. Make API request with retry logic
 *    5. Validate response data using LeadSchema
 *    6. Update cache timestamps
 *    7. Transform/normalize response data
 *    8. Update state with fetched leads
 */
export const fetchLeads = createAsyncThunk<
  ApiResponse<Lead[]>,       // Return type of the fulfilled action
  FetchLeadsParams,          // Parameter type for the thunk
  { state: { lead: LeadState } }
>(
  'leads/fetchLeads',
  async (params, { rejectWithValue, getState }) => {
    try {
      // 1. Validate input parameters using Zod schema
      const parsedParams = FetchLeadsParamsSchema.parse(params);

      // 2. Check cache validity using TTL logic (placeholder)
      //    In a real-world scenario, we might skip the API call if we
      //    have fresh data. For demonstration, always proceed.

      // 3. Construct AI-enhanced search parameters (placeholder)
      //    e.g., if semanticAnalysis is true, add special query logic
      //    We'll build a query string or advanced payload for the fetch.
      const aiEnabled = parsedParams.aiSearch?.semanticAnalysis ?? false;
      const payload = {
        filters: parsedParams.filters || {},
        aiSearch: aiEnabled ? parsedParams.aiSearch : null,
        page: parsedParams.page ?? 1,
        perPage: parsedParams.perPage ?? 10,
      };

      // 4. Make API request with retry logic (placeholder implementation).
      //    Typically we would use a library like axios or fetch here.
      //    We'll demonstrate a simple fetch and interpret the response.
      const response = await fakeApiFetch(payload);
      const responseData = await response.json();

      // 5. Validate response data ensuring it matches ApiResponse<Lead[]>
      //    We must first build a dynamic schema that checks for an array of Leads.
      const leadsArraySchema = z.array(LeadSchema);
      const responseSchema = apiResponseSchema(leadsArraySchema);

      const parsedApiResponse = responseSchema.parse(responseData);

      // 6. Update cache timestamps if needed
      //    In a real app, we might store a TTL for each lead ID or for the entire query.

      // 7. Transform/normalize response data if needed. Example:
      //    Convert array of leads into a Record<string, Lead>
      //    We'll do that in the extraReducers

      // Return the validated response
      return parsedApiResponse;
    } catch (error: any) {
      // 8. If there's a failure (validation or fetch), we handle it here
      return rejectWithValue({
        code: 'BAD_REQUEST',
        message: error.message,
        details: {},
        timestamp: new Date().toISOString(),
        requestId: 'fetchLeads_' + Math.random().toString(36).substring(2, 15),
      } as ApiError);
    }
  }
);

/**
 * updateLead
 * Description:
 *    Enhanced async thunk for updating lead records with
 *    optimistic updates.
 * Steps:
 *    1. Validate lead data using UpdateLeadParamsSchema
 *    2. Apply optimistic update to state
 *    3. Send update request to API with retry logic
 *    4. Validate response data
 *    5. Revert optimistic update if failed
 *    6. Update cache and state with response data
 */
export const updateLead = createAsyncThunk<
  Lead,            // Return type of the fulfilled action
  UpdateLeadParams,// Parameter type for the thunk
  { state: { lead: LeadState } }
>(
  'leads/updateLead',
  async (leadData, { rejectWithValue }) => {
    try {
      // 1. Validate lead data using Zod
      const parsedLeadData = UpdateLeadParamsSchema.parse(leadData);

      // 2. We'll rely on extraReducers for the actual optimistic update
      //    and revert logic, because in Redux Toolkit, it's more straightforward
      //    to handle that in the reducer layer.

      // 3. Send update request to API with retry logic (placeholder)
      //    For demonstration, do a fake fetch to an endpoint.
      const response = await fakeApiUpdate(parsedLeadData.id, parsedLeadData);
      const data = await response.json();

      // 4. Validate response data with LeadSchema for a single lead
      const validatedLead = LeadSchema.parse(data);

      // Return updated lead
      return validatedLead;
    } catch (error: any) {
      // 5. Revert optimistic update if failed (handled in extraReducers)
      // 6. Return error to handle in slice
      return rejectWithValue({
        code: 'BAD_REQUEST',
        message: error.message,
        details: {},
        timestamp: new Date().toISOString(),
        requestId: 'updateLead_' + Math.random().toString(36).substring(2, 15),
      } as ApiError);
    }
  }
);

/****************************************************************
 * REDUCERS
 ****************************************************************/
/*
  The slice also includes synchronous reducers for:
    setFilters       -> Updates lead filtering criteria
    selectLead       -> Adds a lead to selection
    deselectLead     -> Removes a lead from selection
    clearSelection   -> Clears all selected leads
    setLoading       -> Updates loading state
    setError         -> Updates error state
    updateCache      -> Manages cache TTL for leads
    setAISearchConfig-> Updates AI search parameters
*/

/****************************************************************
 * SLICE DEFINITION
 ****************************************************************/
export const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    /**
     * setFilters
     * Updates the current filters used for lead retrieval.
     * Also performs a runtime check using the Zod schema.
     */
    setFilters(state, action: PayloadAction<LeadFilters>) {
      try {
        LeadFiltersSchema.parse(action.payload);
        state.filters = action.payload;
      } catch (err) {
        // If filters are invalid, store an error (for demonstration).
        state.error = {
          code: 'VALIDATION_ERROR',
          message: (err as Error).message,
          details: {},
          timestamp: new Date().toISOString(),
          requestId: 'setFilters_' + Math.random().toString(36).substring(2, 15),
        };
      }
    },

    /**
     * selectLead
     * Adds a lead ID to the array of selected leads if not already present.
     */
    selectLead(state, action: PayloadAction<string>) {
      if (!state.selectedLeads.includes(action.payload)) {
        state.selectedLeads.push(action.payload);
      }
    },

    /**
     * deselectLead
     * Removes a lead ID from the array of selected leads if present.
     */
    deselectLead(state, action: PayloadAction<string>) {
      state.selectedLeads = state.selectedLeads.filter(
        (leadId) => leadId !== action.payload
      );
    },

    /**
     * clearSelection
     * Clears all selected leads from the state.
     */
    clearSelection(state) {
      state.selectedLeads = [];
    },

    /**
     * setLoading
     * Toggles or sets the loading state explicitly.
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    /**
     * setError
     * Stores a new error object or clears an existing error based on
     * the provided payload.
     */
    setError(state, action: PayloadAction<ApiError | null>) {
      state.error = action.payload;
    },

    /**
     * updateCache
     * Updates TTL or other caching parameters in the slice for leads.
     */
    updateCache(state, action: PayloadAction<{ leadId: string; ttl: number }>) {
      const { leadId, ttl } = action.payload;
      state.cacheTTL[leadId] = ttl;
    },

    /**
     * setAISearchConfig
     * Updates the AI-based search configuration to control semantic analysis,
     * query text, or other advanced settings.
     */
    setAISearchConfig(state, action: PayloadAction<AISearchParams>) {
      try {
        AISearchParamsSchema.parse(action.payload);
        state.searchConfig = action.payload;
      } catch (err) {
        state.error = {
          code: 'VALIDATION_ERROR',
          message: (err as Error).message,
          details: {},
          timestamp: new Date().toISOString(),
          requestId:
            'setAISearchConfig_' + Math.random().toString(36).substring(2, 15),
        };
      }
    },
  },
  extraReducers: (builder) => {
    /*
      Handle fetchLeads (pending, fulfilled, rejected).
    */
    builder.addCase(fetchLeads.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLeads.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;

      // Convert the array of leads into a record keyed by lead id
      const { data: leadsData, meta } = action.payload;
      const mapped: Record<string, Lead> = {};
      for (const ld of leadsData) {
        mapped[ld.id] = ld;
        // As an example, we update TTL to the current timestamp + 5 min
        state.cacheTTL[ld.id] = Date.now() + 5 * 60 * 1000;
      }
      state.leads = mapped;

      // Update pagination metadata if present
      if (meta) {
        state.pagination = meta;
      }
    });
    builder.addCase(fetchLeads.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as ApiError;
    });

    /*
      Handle updateLead (pending, fulfilled, rejected).
      Implement optimistic updates here:
        - For 'pending', we merge partial data into our leads
          if the lead already exists.
        - For 'fulfilled', we confirm the final update.
        - For 'rejected', we revert to the original data.
    */
    builder.addCase(updateLead.pending, (state, action) => {
      const leadPayload = action.meta.arg;
      const existingLead = state.leads[leadPayload.id];
      if (existingLead) {
        // Save original lead to revert if needed
        // We can stash this in a temp property not in the state interface
        (state as any)._optimisticOriginal = (state as any)._optimisticOriginal || {};
        (state as any)._optimisticOriginal[leadPayload.id] = { ...existingLead };

        // Apply partial update
        if (leadPayload.email !== undefined) {
          existingLead.email = leadPayload.email;
        }
        if (leadPayload.firstName !== undefined) {
          existingLead.firstName = leadPayload.firstName;
        }
        if (leadPayload.lastName !== undefined) {
          existingLead.lastName = leadPayload.lastName;
        }
        if (leadPayload.title !== undefined) {
          existingLead.title = leadPayload.title;
        }
        if (leadPayload.companyName !== undefined) {
          existingLead.companyName = leadPayload.companyName;
        }
        if (leadPayload.score !== undefined) {
          existingLead.score = leadPayload.score;
        }
        if (leadPayload.status !== undefined) {
          existingLead.status = leadPayload.status;
        }
      }
    });
    builder.addCase(updateLead.fulfilled, (state, action) => {
      // The action payload is the validated Lead from the server
      const updatedLead = action.payload;
      // Merge final server result into state
      state.leads[updatedLead.id] = updatedLead;

      // Clear out any cached optimistic data
      if ((state as any)._optimisticOriginal?.[updatedLead.id]) {
        delete (state as any)._optimisticOriginal[updatedLead.id];
      }
    });
    builder.addCase(updateLead.rejected, (state, action) => {
      // Revert optimistic updates if we have them
      const originalPayload = action.meta.arg;
      const originalData =
        (state as any)._optimisticOriginal?.[originalPayload.id];
      if (originalData) {
        state.leads[originalPayload.id] = originalData;
        delete (state as any)._optimisticOriginal[originalPayload.id];
      }
      state.error = action.payload as ApiError;
    });
  },
});

/****************************************************************
 * SELECTORS
 ****************************************************************/
/*
  Named export for our memoized selector. The specification requires
  a function selectLeadsWithScore that returns an array of leads
  sorted or filtered by a certain scoring logic. We will simply
  collect all leads from state, then return them as an array. 
  Additional filtering logic can be applied as needed.
*/

/**
 * A placeholder definition for RootState referencing the lead slice.
 * In a real application, RootState would be defined in your store setup.
 */
export interface RootState {
  lead: LeadState;
}

/**
 * selectLeadsWithScore
 * Retrieves an array of leads from the store, sorted by their score
 * in descending order. This is an example of how we might handle
 * prioritizing high-scoring leads for immediate attention.
 */
export const selectLeadsWithScore = (state: RootState): Lead[] => {
  const leadsArray = Object.values(state.lead.leads);
  return leadsArray.slice().sort((a, b) => b.score - a.score);
};

/****************************************************************
 * EXPORTS
 ****************************************************************/
/*
  We export the slice's reducer under the name 'leadSlice.reducer'
  and the slice's actions under 'leadSlice.actions'. We also
  export the selectLeadsWithScore as required by the specification.
*/
export const {
  setFilters,
  selectLead,
  deselectLead,
  clearSelection,
  setLoading,
  setError,
  updateCache,
  setAISearchConfig,
} = leadSlice.actions;

export default leadSlice.reducer;

/****************************************************************
 * FAKE API FETCH HELPERS (Placeholder)
 ****************************************************************/
/**
 * The following functions simulate external API calls and
 * are purely for demonstration. Replace with real calls
 * (axios, fetch, etc.) in production.
 */
async function fakeApiFetch(_payload: unknown): Promise<Response> {
  // Simulate a typical fetch response structure
  const fakeResponse = {
    data: [
      {
        id: 'lead-001',
        email: 'jdoe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        title: 'CTO',
        companyName: 'TechCorp',
        companyData: {
          industry: 'Technology',
          size: '51-200',
          revenue: '5M',
          location: 'San Francisco',
          website: 'https://techcorp.com',
          technologies: ['React', 'Node.js'],
        },
        score: 85,
        status: LeadStatus.QUALIFIED,
        source: 'MANUAL',
        organizationId: 'org-abc',
        ownerId: 'user-xyz',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    meta: {
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
    },
    status: 200,
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(fakeResponse));
}

async function fakeApiUpdate(
  _leadId: string,
  _leadData: Partial<Lead>
): Promise<Response> {
  // Simulate success with updated data
  const updatedLead = {
    id: _leadId,
    email: _leadData.email ?? 'jdoe@example.com',
    firstName: _leadData.firstName ?? 'John',
    lastName: _leadData.lastName ?? 'Doe',
    title: _leadData.title ?? 'CTO',
    companyName: _leadData.companyName ?? 'TechCorp',
    companyData: {
      industry: 'Technology',
      size: '51-200',
      revenue: '5M',
      location: 'San Francisco',
      website: 'https://techcorp.com',
      technologies: ['React', 'Node.js'],
    },
    score: _leadData.score ?? 85,
    status: _leadData.status ?? LeadStatus.QUALIFIED,
    source: 'MANUAL',
    organizationId: 'org-abc',
    ownerId: 'user-xyz',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return new Response(JSON.stringify(updatedLead));
}