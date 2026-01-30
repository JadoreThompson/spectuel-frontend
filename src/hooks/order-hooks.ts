import {
    cancelOrderOrdersOrderIdDelete,
    createOcoOrderOrdersOcoPost,
    createOrderOrdersPost,
    createOtoOrderOrdersOtoPost,
    createOtocoOrderOrdersOtocoPost,
    getOrderOrdersOrderIdGet,
    getOrdersByGroupOrdersGroupsGroupIdGet,
    getOrdersOrdersGet,
    modifyOrderOrdersOrderIdPatch,
    type GetOrdersOrdersGetParams,
    type OCOOrderCreate,
    type OTOCOOrderCreate,
    type OTOOrderCreate,
    type OrderModify,
    type SingleOrderCreate,
} from '@/openapi'
import { useMutation, useQuery } from '@tanstack/react-query'

// ============================================================================
// ORDER HOOKS
// ============================================================================

// Create Order Mutation
export const useCreateOrderMutation = () => {
    return useMutation({
        mutationFn: (orderData: SingleOrderCreate) =>
            createOrderOrdersPost(orderData),
    })
}

// Get Orders Query
export const useGetOrdersQuery = (params?: GetOrdersOrdersGetParams) => {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: async () => getOrdersOrdersGet(params),
    })
}

// Create OCO Order Mutation
export const useCreateOcoOrderMutation = () => {
    return useMutation({
        mutationFn: (orderData: OCOOrderCreate) =>
            createOcoOrderOrdersOcoPost(orderData),
    })
}

// Create OTO Order Mutation
export const useCreateOtoOrderMutation = () => {
    return useMutation({
        mutationFn: (orderData: OTOOrderCreate) =>
            createOtoOrderOrdersOtoPost(orderData),
    })
}

// Create OTOCO Order Mutation
export const useCreateOtocoOrderMutation = () => {
    return useMutation({
        mutationFn: (orderData: OTOCOOrderCreate) =>
            createOtocoOrderOrdersOtocoPost(orderData),
    })
}

// Get Order by ID Query
export const useGetOrderQuery = (orderId: string) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => getOrderOrdersOrderIdGet(orderId),
        enabled: !!orderId,
    })
}

// Modify Order Mutation
export const useModifyOrderMutation = () => {
    return useMutation({
        mutationFn: ({
            orderId,
            orderData,
        }: {
            orderId: string
            orderData: OrderModify
        }) => modifyOrderOrdersOrderIdPatch(orderId, orderData),
    })
}

// Cancel Order Mutation
export const useCancelOrderMutation = () => {
    return useMutation({
        mutationFn: (orderId: string) =>
            cancelOrderOrdersOrderIdDelete(orderId),
    })
}

// Get Orders by Group Query
export const useGetOrdersByGroupQuery = (groupId: string) => {
    return useQuery({
        queryKey: ['orderGroup', groupId],
        queryFn: () => getOrdersByGroupOrdersGroupsGroupIdGet(groupId),
        enabled: !!groupId,
    })
}
