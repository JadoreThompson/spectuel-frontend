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
        queryKey: ['userOverview'],
        queryFn: () => getUserOverviewUserGet(),
    })
}

// Get User Events Query
export const useGetUserEventsQuery = (
    params: GetUserEventsUserEventsGetParams
) => {
    return useQuery({
        queryKey: ['userEvents', params],
        queryFn: () => getUserEventsUserEventsGet(params),
    })
}

// Get Asset Balances Query
export const useGetAssetBalancesQuery = (
    params?: GetAssetBalancesUserAssetBalancesGetParams
) => {
    return useQuery({
        queryKey: ['assetBalances', params],
        queryFn: () => getAssetBalancesUserAssetBalancesGet(params),
    })
}
