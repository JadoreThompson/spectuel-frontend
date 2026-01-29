import {
    getMarketBarsMarketsSymbolBarsGet,
    type GetMarketBarsMarketsSymbolBarsGetParams,
} from '@/openapi'
import { useQuery } from '@tanstack/react-query'

// ============================================================================
// MARKET HOOKS
// ============================================================================

// Get Market Bars Query
export const useGetMarketBarsQuery = (
    symbol: string,
    params: GetMarketBarsMarketsSymbolBarsGetParams
) => {
    return useQuery({
        queryKey: ['marketBars', symbol, params],
        queryFn: () => getMarketBarsMarketsSymbolBarsGet(symbol, params),
        enabled: !!symbol,
    })
}
