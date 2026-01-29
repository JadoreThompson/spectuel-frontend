import { CustomToaster } from '@/components/CustomToaster'
import EventLog, { type Log } from '@/components/EventLog'
import SpotOrderForm from '@/components/forms/SpotOrderForm'
import Header from '@/components/Header'
import StatusBar from '@/components/StatusBar'
import OpenOrdersTable from '@/components/tables/OpenOrdersTable'
import OrderHistoryTable from '@/components/tables/OrderHistoryTable'
import { Button } from '@/components/ui/button'

import { WS_BASE_URL } from '@/config'
import {
    useGetAssetBalancesQuery,
    useGetOrdersQuery,
    useGetUserEventsQuery,
    useGetUserOverviewQuery,
    useGetWsTokenQuery,
} from '@/hooks'
import {
    GetUserEventsUserEventsGetType,
    OrderStatus,
    type OrderEventRead,
    type OrderRead,
} from '@/openapi'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

// Custom types
interface UserOverviewResponse {
    cash_balance: number
    data: { [k: string]: number }
}

enum EventType {
    ORDER_PLACED = 'order_placed',
    ORDER_PARTIALLY_FILLED = 'order_partially_filled',
    ORDER_FILLED = 'order_filled',
    ORDER_CANCELLED = 'order_cancelled',
    ORDER_MODIFIED = 'order_modified',
    ORDER_MODIFY_REJECTED = 'order_modify_rejected',
    ORDER_REJECTED = 'order_rejected',
}


// Constants
const SPOT_TABS = ['orders', 'history'] as const
type SpotTab = (typeof SPOT_TABS)[number]
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

// Table Card Component
const SpotTableCard: FC<{
    tab: SpotTab
    openOrders: OrderRead[]
    orderHistory: OrderRead[]
    handleTabChange: (value: SpotTab) => void
    handleOpenOrdersScrollEnd: () => void
    handleHistoryScrollEnd: () => void
}> = (props) => {
    return (
        <div className="w-full bg-background rounded-sm p-1">
            <div className="w-full flex justify-between px-3">
                <div className="w-full mb-2 flex items-center justify-start p-3">
                    {SPOT_TABS.map((t) => (
                        <Button
                            key={t}
                            type="button"
                            className={`bg-transparent hover:bg-transparent rounded-none border-b-2 hover:text-white cursor-pointer ${
                                props.tab === t
                                    ? 'border-b-white text-white'
                                    : 'border-b-transparent text-neutral-900'
                            }`}
                            onClick={() => props.handleTabChange(t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="w-full p-3">
                {props.tab === 'orders' && (
                    <OpenOrdersTable
                        orders={props.openOrders}
                        onScrollEnd={props.handleOpenOrdersScrollEnd}
                        showActions
                    />
                )}
                {props.tab === 'history' && (
                    <OrderHistoryTable
                        orders={props.orderHistory}
                        onScrollEnd={props.handleHistoryScrollEnd}
                    />
                )}
            </div>
        </div>
    )
}

// Main Component
const TradingPage: FC = () => {
    const { symbol } = useParams()
    const [tableTab, setTableTab] = useState<SpotTab>('orders')

    // State
    const [balance, setBalance] = useState<number | null>(null)
    const [assetBalance, setAssetBalance] = useState<number | null>(null)
    const [events, setEvents] = useState<Log[]>([])
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus>('disconnected')
    const [openOrders, setOpenOrders] = useState<OrderRead[]>([])
    const [orderHistory, setOrderHistory] = useState<OrderRead[]>([])
    const hasNextRef = useRef<boolean>(true)
    const pageNumRef = useRef<number>(0)

    // React Query hooks
    const userOverviewQuery = useGetUserOverviewQuery()
    const assetBalancesQuery = useGetAssetBalancesQuery({
        symbols: symbol!,
    })
    const wsTokenQuery = useGetWsTokenQuery()
    const userEventsQuery = useGetUserEventsQuery({
        type: GetUserEventsUserEventsGetType.order,
    })
    const openOrdersQuery = useGetOrdersQuery({
        page: pageNumRef.current + 1,
        status: [
            OrderStatus.pending,
            OrderStatus.placed,
            OrderStatus.partially_filled,
        ],
        symbols: [symbol!],
        order_by: 'desc',
    })
    const orderHistoryQuery = useGetOrdersQuery({
        page: pageNumRef.current + 1,
        symbols: [symbol!],
        order_by: 'desc',
    })

    // Update balance when user overview data changes
    useEffect(() => {
        if (userOverviewQuery.data?.status === 200) {
            const data = userOverviewQuery.data.data as UserOverviewResponse
            setBalance(data.cash_balance)
        }
    }, [userOverviewQuery.data])

    // Update asset balance when asset balances data changes
    useEffect(() => {
        if (assetBalancesQuery.data?.status === 200) {
            const balances = assetBalancesQuery.data.data
            const assetItem = balances.find((item) => item.symbol === symbol)
            if (assetItem) {
                setAssetBalance(assetItem.quantity)
            }
        }
    }, [assetBalancesQuery.data, symbol])

    // Update events when user events data changes
    useEffect(() => {
        if (userEventsQuery.data?.status === 200) {
            const data = userEventsQuery.data.data.data as OrderEventRead[]
            setEvents(
                data.map((val) => ({
                    event_type: val.type as EventType,
                    message: `Order ID: ${val.order_id}`,
                }))
            )
        }
    }, [userEventsQuery.data])

    // Update open orders when query data changes
    useEffect(() => {
        if (openOrdersQuery.data?.status === 200) {
            const data = openOrdersQuery.data.data
            setOpenOrders((prev) => {
                // Filter out duplicates by checking order_id
                const existingIds = new Set(prev.map((order) => order.order_id))
                const newOrders = data.data.filter(
                    (order) => !existingIds.has(order.order_id)
                )
                return [...prev, ...newOrders]
            })
            hasNextRef.current = data.has_next
        }
    }, [openOrdersQuery.data])

    // Update order history when query data changes
    useEffect(() => {
        if (orderHistoryQuery.data?.status === 200) {
            const data = orderHistoryQuery.data.data
            setOrderHistory((prev) => {
                // Filter out duplicates by checking order_id
                const existingIds = new Set(prev.map((order) => order.order_id))
                const newOrders = data.data.filter(
                    (order) => !existingIds.has(order.order_id)
                )
                return [...prev, ...newOrders]
            })
            hasNextRef.current = data.has_next
        }
    }, [orderHistoryQuery.data])

    // Handle order update
    const handleOrderUpdate = useCallback(
        (
            incomingOrder: OrderRead,
            setter: React.Dispatch<React.SetStateAction<OrderRead[]>>
        ) => {
            setter((prev) => {
                const existingIndex =
                    prev?.findIndex(
                        (order) => order.order_id === incomingOrder.order_id
                    ) ?? -1
                console.log('Existing index', existingIndex)
                if (existingIndex >= 0) {
                    return prev.map((order, index) =>
                        index === existingIndex
                            ? { ...order, ...incomingOrder }
                            : order
                    )
                } else {
                    return prev
                }
            })
        },
        []
    )

    // Handle order removal
    const handleOrderRemoval = useCallback((orderId: string) => {
        setOpenOrders((prev) =>
            prev.filter((order) => order.order_id !== orderId)
        )
    }, [])

    // Order placed handler
    const handleOrderPlaced = useCallback((order: OrderRead) => {
        setOpenOrders((prev) => [order, ...prev])
    }, [])

    // Tab change handler
    const handleTabChange = useCallback((tab: SpotTab) => {
        pageNumRef.current = 1
        hasNextRef.current = true
        setTableTab(tab)
    }, [])

    // Scroll end handlers
    const handleOpenOrdersScrollEnd = useCallback(() => {
        if (hasNextRef.current) {
            pageNumRef.current += 1
        }
    }, [])

    const handleHistoryScrollEnd = useCallback(() => {
        if (hasNextRef.current) {
            pageNumRef.current += 1
        }
    }, [])

    // Orders WebSocket
    useEffect(() => {
        const wsToken =
            wsTokenQuery.data?.status === 200
                ? wsTokenQuery.data.data.token
                : undefined

        if (!wsToken) return

        const ws = new WebSocket(`${WS_BASE_URL}/ws/orders/`)

        const handleWsHeartbeat = async (ws: WebSocket) => {
            while (ws.readyState === WebSocket.OPEN) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping')
                }
            }
        }

        ws.onopen = () => {
            setConnectionStatus('connecting')
            ws.send(JSON.stringify({ token: wsToken }))
            handleWsHeartbeat(ws)
        }

        ws.onmessage = (e) => {
            if (e.data === 'connected') {
                setConnectionStatus('connected')
                return
            }

            if (e.data === 'pong') {
                return
            }

            const msg = JSON.parse(e.data)

            if (msg.type === 'ack' && msg.request_type == 'subscribe') return

            if (msg.type === 'ack' && msg.request_type == 'auth') {
                ws.send(
                    JSON.stringify({
                        type: 'subscribe',
                        order_events: [
                            'order_placed',
                            'order_partially_filled',
                            'order_filled',
                        ],
                        balance_events: [
                            'cash_balance_increased',
                            'cash_balance_decreased',
                            'cash_escrow_increased',
                            'cash_escrow_decreased',
                            'asset_balance_increased',
                            'asset_balance_decreased',
                            'asset_escrow_increased',
                            'asset_escrow_decreased',
                        ],
                    })
                )
                return
            }

            console.log('WS Raw message:', msg)
            if (msg.type === 'error') {
                toast.error('WebSocket error: ' + msg.message)
                return
            }

            console.log('Received WS message:', msg)

            // Handle order events
            if (msg.type && msg.type.startsWith('order_')) {
                // Add to events log for all order events
                setEvents((prev: Log[]) => {
                    const newEvents = [...prev]
                    newEvents.unshift({
                        event_type: msg.type as EventType,
                        message: `Order ID: ${msg.order.order_id}`,
                    })
                    return newEvents
                })

                if (msg.type === 'order_placed') {
                    const orderData: OrderRead = {
                        order_id: msg.order.order_id,
                        symbol: msg.order.symbol,
                        quantity: msg.order.quantity,
                        executed_quantity: msg.order.executed_quantity,
                        limit_price: msg.order.limit_price,
                        stop_price: msg.order.stop_price,
                        avg_fill_price: msg.order.avg_fill_price,
                        side: msg.order.side,
                        status: msg.order.status,
                        order_type: msg.order.order_type,
                        strategy_type: msg.order.strategy_type,
                        created_at: msg.order.created_at,
                    }

                    // Add to open orders and history
                    handleOrderUpdate(orderData, setOpenOrders)
                    handleOrderUpdate(orderData, setOrderHistory)

                    toast.success(
                        `Order placed: ${msg.order.symbol} ${msg.order.side} ${msg.order.quantity} @ ${msg.order.limit_price}`
                    )
                } else if (msg.type === 'order_filled') {
                    // Remove from open orders only, don't push to history
                    handleOrderRemoval(msg.order.order_id)
                    toast.success(`Order filled: ${msg.order.symbol}`)
                } else if (msg.type === 'order_partially_filled') {
                    const orderData: OrderRead = {
                        order_id: msg.order.order_id,
                        symbol: msg.order.symbol,
                        quantity: msg.order.quantity,
                        executed_quantity: msg.order.executed_quantity,
                        limit_price: msg.order.limit_price,
                        stop_price: msg.order.stop_price,
                        avg_fill_price: msg.order.avg_fill_price,
                        side: msg.order.side,
                        status: msg.order.status,
                        order_type: msg.order.order_type,
                        strategy_type: msg.order.strategy_type,
                        created_at: msg.order.created_at,
                    }

                    // Update in both tables
                    handleOrderUpdate(orderData, setOpenOrders)
                    handleOrderUpdate(orderData, setOrderHistory)

                    toast.info(`Order partially filled: ${msg.order.symbol}`)
                } else if (msg.type === 'order_cancelled') {
                    // Remove from open orders only
                    handleOrderRemoval(msg.order.order_id)
                    toast.info(`Order cancelled: ${msg.order.symbol}`)
                }
            }
        }

        ws.onclose = () => setConnectionStatus('disconnected')

        return () => ws.close()
    }, [wsTokenQuery.data, handleOrderUpdate, handleOrderRemoval])

    return (
        <>
            <CustomToaster />
            <div className="w-full h-auto flex pb-7">
                <Header />

                <main className="w-full min-h-screen mt-10 flex flex-row gap-1 p-1">
                    {/* Main Trading Area */}
                    <div className="w-[70%] flex flex-col gap-1">
                        {/* Tables Section */}
                        <div className="w-full flex flex-row gap-1">
                            <SpotTableCard
                                tab={tableTab}
                                openOrders={openOrders}
                                orderHistory={orderHistory}
                                handleTabChange={handleTabChange}
                                handleOpenOrdersScrollEnd={
                                    handleOpenOrdersScrollEnd
                                }
                                handleHistoryScrollEnd={handleHistoryScrollEnd}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="flex-1 flex flex-col">
                        <div className="min-h-150 rounded-tl-sm rounded-tr-sm border-b-1 border-b-neutral-900 bg-background">
                            <SpotOrderForm
                                balance={balance}
                                assetBalance={assetBalance}
                                symbol={symbol!}
                                setBalance={
                                    setBalance as React.Dispatch<
                                        React.SetStateAction<number>
                                    >
                                }
                                onOrderPlaced={handleOrderPlaced}
                            />
                        </div>
                        <div className="flex-1 h-auto max-h-fit min-h-0 sticky top-11 bg-background">
                            <EventLog data={events} />
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <div className="w-full h-7 min-h-0 max-h-10 z-[999] fixed bottom-0">
                    <StatusBar connectionStatus={connectionStatus} />
                </div>
            </div>
        </>
    )
}

export default TradingPage
