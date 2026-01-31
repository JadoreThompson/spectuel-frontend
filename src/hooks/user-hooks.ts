import { queryKeys } from '@/lib/query/query-keys'
import {
    getAssetBalancesUserAssetBalancesGet,
    getUserEventsUserEventsGet,
    getUserOverviewUserGet,
    type GetAssetBalancesUserAssetBalancesGetParams,
    type GetUserEventsUserEventsGetParams,
} from '@/openapi'
import { useQuery } from '@tanstack/react-query'

// ============================================================================
// USER HOOKS
// ============================================================================

// Get User Overview Query
export const useGetUserOverviewQuery = () => {
    return useQuery({
        queryKey: queryKeys.user.overview(),
        queryFn: async () => getUserOverviewUserGet(),
    })
}

// Get User Events Query
export const useGetUserEventsQuery = (
    params: GetUserEventsUserEventsGetParams
) => {
    return useQuery({
        queryKey: queryKeys.user.events(params),
        queryFn: async () => getUserEventsUserEventsGet(params),
    })
}

// Get Asset Balances Query
export const useGetAssetBalancesQuery = (
    params?: GetAssetBalancesUserAssetBalancesGetParams
) => {
    return useQuery({
        queryKey: queryKeys.user.assetBalances(params),
        queryFn: async () => getAssetBalancesUserAssetBalancesGet(params),
    })
}
