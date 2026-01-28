import { useMutation, useQuery } from '@tanstack/react-query'
import {
    createOrderOrdersPost,
    getOrdersOrdersGet,
    modifyOrderOrdersOrderIdPatch,
    cancelOrderOrdersOrderIdDelete,
    type SingleOrderCreate,
    type OrderModify,
    type GetOrdersOrdersGetParams,
} from '@/openapi'

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
        queryFn: () => getOrdersOrdersGet(params),
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
