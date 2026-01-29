// src/components/tables/OpenOrdersTable.tsx

import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import {
    useCancelOrderMutation,
    useModifyOrderMutation,
} from '@/hooks/useOrderHooks'
import type { OrderTableProps } from '@/lib/props/tableProps.'
import { cn, formatUnderscore } from '@/lib/utils'
import { OrderType, Side, type OrderRead } from '@/openapi'
import { Pencil, X } from 'lucide-react'
import React, { useCallback, useState, type FC } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

// --- TYPE DEFINITIONS ---
type ModalState = { type: 'modify' | 'cancel'; order: OrderRead } | null

// --- MODAL COMPONENTS (Simplified) ---

const ModifyModal: FC<{
    order: OrderRead
    onSubmit: (data: {
        limit_price?: number
        stop_price?: number
    }) => Promise<boolean>
    onClose: () => void
    error: string | null
}> = (props) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const isModifiable =
        props.order.order_type === OrderType.limit ||
        props.order.order_type === OrderType.stop

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!isModifiable) return

        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const payload: { limit_price?: number; stop_price?: number } = {}

        if (props.order.order_type === OrderType.limit) {
            const limitPrice = parseFloat(formData.get('limit_price') as string)
            if (!isNaN(limitPrice) && limitPrice > 0)
                payload.limit_price = limitPrice
        } else if (props.order.order_type === OrderType.stop) {
            const stopPrice = parseFloat(formData.get('stop_price') as string)
            if (!isNaN(stopPrice) && stopPrice > 0)
                payload.stop_price = stopPrice
        }

        const success = await props.onSubmit(payload)
        if (success) props.onClose()
        else setIsSubmitting(false)
    }

    return (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60">
            <form
                onSubmit={handleSubmit}
                className="w-[400px] p-6 border border-neutral-800 rounded-xl space-y-4 shadow-lg bg-background"
            >
                <h2 className="text-lg font-semibold">
                    Modify Order: {props.order.symbol}
                </h2>
                {isModifiable ? (
                    <>
                        {props.order.order_type === OrderType.limit && (
                            <div>
                                <label className="block text-sm mb-1 text-muted-foreground">
                                    New Limit Price
                                </label>
                                <Input
                                    type="number"
                                    name="limit_price"
                                    defaultValue={props.order.limit_price ?? ''}
                                    step="any"
                                    min="0"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                        {props.order.order_type === OrderType.stop && (
                            <div>
                                <label className="block text-sm mb-1 text-muted-foreground">
                                    New Stop Price
                                </label>
                                <Input
                                    type="number"
                                    name="stop_price"
                                    defaultValue={props.order.stop_price ?? ''}
                                    step="any"
                                    min="0"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Market orders cannot be modified.
                    </p>
                )}
                {props.error && (
                    <div className="text-center text-red-500 text-sm p-2 bg-red-500/10 rounded-md">
                        {props.error}
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        onClick={props.onClose}
                        variant="ghost"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    {isModifiable && (
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Changes'}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    )
}

const CancelModal: FC<{
    order: OrderRead
    onSubmit: () => Promise<boolean>
    onClose: () => void
    error: string | null
}> = (props) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = async () => {
        setIsSubmitting(true)
        const success = await props.onSubmit()
        if (success) props.onClose()
        else setIsSubmitting(false)
    }

    return (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60">
            <div className="w-[400px] p-6 border border-neutral-800 rounded-xl space-y-4 shadow-lg bg-background">
                <h2 className="text-lg font-semibold">
                    Cancel Order Confirmation
                </h2>
                <p className="text-sm text-muted-foreground">
                    Are you sure you want to cancel your{' '}
                    {formatUnderscore(props.order.order_type)} order for{' '}
                    <span className="font-semibold text-white">
                        {props.order.quantity} of {props.order.symbol}
                    </span>
                    ?
                </p>
                {props.error && (
                    <div className="text-center text-red-500 text-sm p-2 bg-red-500/10 rounded-md">
                        {props.error}
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        onClick={props.onClose}
                        variant="ghost"
                        disabled={isSubmitting}
                    >
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        variant="destructive"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// --- ORDER DETAIL ROW (Restored Original Style) ---

const OrderDetailRow: FC<{
    order: OrderRead
    showActions: boolean
    onModify: () => void
    onCancel: () => void
}> = (props) => (
    <tr className="border-t border-neutral-800 bg-neutral-900/50">
        <td colSpan={props.showActions ? 7 : 6} className="p-4">
            <div className="space-y-4">
                <div className="w-full flex justify-between">
                    <div className="flex flex-col">
                        <span className="w-fit text-md font-bold mb-1">
                            {props.order.symbol}
                        </span>
                        <div className="flex flex-row gap-2">
                            <span
                                className={`w-fit py-1 px-2 rounded-sm text-xs ${props.order.side === Side.bid ? 'bg-green-500/20 text-[var(--green)]' : 'bg-red-500/20 text-[var(--red)]'}`}
                            >
                                {formatUnderscore(props.order.side)}
                            </span>
                            <span className="w-fit py-1 px-2 rounded-sm text-xs bg-neutral-500/10 text-neutral-500">
                                {formatUnderscore(props.order.order_type)} Order
                            </span>
                        </div>
                    </div>
                    <span className="text-neutral-500 text-xs">
                        {new Date(props.order.created_at).toLocaleString()}
                    </span>
                </div>
                <div className="w-full flex justify-between items-end">
                    <div className="flex flex-row justify-start gap-x-8 gap-y-2 flex-wrap">
                        {[
                            {
                                label: 'Avg Filled Price',
                                value: props.order.avg_fill_price,
                            },
                            {
                                label: 'Limit Price',
                                value: props.order.limit_price,
                            },
                            {
                                label: 'Stop Price',
                                value: props.order.stop_price,
                            },
                            {
                                label: 'Executed Quantity',
                                value: props.order.executed_quantity,
                            },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex flex-col">
                                <span className="text-xs text-neutral-400 whitespace-nowrap">
                                    {label}
                                </span>
                                <span className="text-sm text-white">
                                    {typeof value === 'number' ? value : '--'}
                                </span>
                            </div>
                        ))}
                    </div>
                    {props.showActions && (
                        <div className="flex flex-row items-center justify-end gap-3">
                            <Button
                                type="button"
                                disabled={
                                    props.order.order_type === OrderType.market
                                }
                                onClick={props.onModify}
                                className="h-8 w-20 rounded-md"
                            >
                                Modify
                            </Button>
                            <Button
                                type="button"
                                onClick={props.onCancel}
                                variant="destructive"
                                className="h-8 w-20 rounded-md"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </td>
    </tr>
)

// --- MAIN COMPONENT ---

const OpenOrdersTable: FC<OrderTableProps & { showActions: boolean }> = (
    props
) => {
    const [modalState, setModalState] = useState<ModalState>(null)
    const [focusedOrder, setFocusedOrder] = useState<OrderRead | null>(null)
    const [error, setError] = useState<string | null>(null)
    const tableBottomRef = useIntersectionObserver(props.onScrollEnd)

    const modifyOrderMutation = useModifyOrderMutation()
    const cancelOrderMutation = useCancelOrderMutation()

    const handleRowClick = useCallback((order: OrderRead) => {
        setFocusedOrder((prev: OrderRead | null) =>
            prev?.order_id === order.order_id ? null : order
        )
    }, [])

    const closeModal = () => {
        setModalState(null)
        setError(null)
    }

    const handleModifyOrder = async (
        orderId: string,
        data: { limit_price?: number; stop_price?: number }
    ): Promise<boolean> => {
        setError(null)
        try {
            const response = await modifyOrderMutation.mutateAsync({
                orderId,
                orderData: data,
            })

            if (response.status === 202) {
                return true
            } else {
                // Handle non-202 response
                throw new Error('Failed to modify order')
            }
        } catch (err: any) {
            // The customFetch throws an object with { status, data, headers }
            const errorMessage =
                err?.data?.error || err?.message || 'An unknown error occurred.'
            setError(errorMessage)
            return false
        }
    }

    const handleCancelOrder = async (orderId: string): Promise<boolean> => {
        setError(null)
        try {
            const response = await cancelOrderMutation.mutateAsync(orderId)

            if (response.status === 202) {
                return true
            } else {
                // Handle non-202 response
                throw new Error('Failed to cancel order')
            }
        } catch (err: any) {
            // The customFetch throws an object with { status, data, headers }
            const errorMessage =
                err?.data?.error || err?.message || 'An unknown error occurred.'
            setError(errorMessage)
            return false
        }
    }

    return (
        <>
            {modalState?.type === 'modify' && (
                <ModifyModal
                    order={modalState.order}
                    onClose={closeModal}
                    error={error}
                    onSubmit={(data) =>
                        handleModifyOrder(modalState.order.order_id, data)
                    }
                />
            )}
            {modalState?.type === 'cancel' && (
                <CancelModal
                    order={modalState.order}
                    onClose={closeModal}
                    error={error}
                    onSubmit={() =>
                        handleCancelOrder(modalState.order.order_id)
                    }
                />
            )}
            <div className="w-full h-full overflow-auto">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="text-sm font-semibold">
                        <tr className="text-neutral-500">
                            <th>Symbol</th>
                            <th>Side</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Status</th>
                            {props.showActions && (
                                <th className="text-right pr-4">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {props.orders.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={props.showActions ? 7 : 6}
                                    className="h-20 text-center"
                                >
                                    <span className="text-neutral-500">
                                        No open orders
                                    </span>
                                </td>
                            </tr>
                        ) : (
                            props.orders.map((order: OrderRead) => (
                                <React.Fragment key={order.order_id}>
                                    <tr
                                        className="h-10 border-t border-neutral-800 hover:bg-neutral-800/50 cursor-pointer"
                                        onClick={() => handleRowClick(order)}
                                    >
                                        <td>{order.symbol}</td>
                                        <td
                                            className={cn(
                                                order.side === Side.bid
                                                    ? 'text-[var(--green)]'
                                                    : 'text-[var(--red)]'
                                            )}
                                        >
                                            {formatUnderscore(order.side)}
                                        </td>
                                        <td>
                                            {formatUnderscore(order.order_type)}
                                        </td>
                                        <td>{order.quantity}</td>
                                        <td>
                                            {order.limit_price ??
                                                order.stop_price ??
                                                '--'}
                                        </td>
                                        <td>
                                            {formatUnderscore(order.status)}
                                        </td>
                                        {props.showActions && (
                                            <td className="text-right pr-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Pencil
                                                        className={cn(
                                                            'size-4 cursor-pointer text-neutral-400 hover:text-white',
                                                            order.order_type ===
                                                                OrderType.market &&
                                                                'cursor-not-allowed opacity-30'
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (
                                                                order.order_type !==
                                                                OrderType.market
                                                            )
                                                                setModalState({
                                                                    type: 'modify',
                                                                    order,
                                                                })
                                                        }}
                                                    />
                                                    <X
                                                        className="size-5 cursor-pointer text-neutral-400 hover:text-red-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setModalState({
                                                                type: 'cancel',
                                                                order,
                                                            })
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                    {focusedOrder?.order_id ===
                                        order.order_id && (
                                        <OrderDetailRow
                                            order={order}
                                            showActions={props.showActions}
                                            onModify={() =>
                                                setModalState({
                                                    type: 'modify',
                                                    order,
                                                })
                                            }
                                            onCancel={() =>
                                                setModalState({
                                                    type: 'cancel',
                                                    order,
                                                })
                                            }
                                        />
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
                <div ref={tableBottomRef} className="h-1" />
            </div>
        </>
    )
}

export default OpenOrdersTable
