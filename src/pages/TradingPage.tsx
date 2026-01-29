import ChartPanel from '@/components/ChartPanel'
import EventLog, { type Log } from '@/components/EventLog'
import SpotOrderForm from '@/components/forms/SpotOrderForm'
import Header from '@/components/Header'
import OrderBook, { type PriceLevel } from '@/components/OrderBook'
import RecentTrades from '@/components/RecentTrades'
import StatusBar from '@/components/StatusBar'
import OpenOrdersTable from '@/components/tables/OpenOrdersTable'
import OrderHistoryTable from '@/components/tables/OrderHistoryTable'
import { Button } from '@/components/ui/button'

import { HTTP_BASE_URL, WS_BASE_URL } from '@/config'
import {
    OrderStatus,
    Side,
    type OrderRead,
    type PaginatedResponseOrderRead,
} from '@/openapi'
import {
    type CandlestickData,
    type ISeriesApi,
    type Time,
} from 'lightweight-charts'
import { ChevronUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'
import { useParams } from 'react-router'

// Custom types not in OpenAPI spec
enum TimeFrame {
    M5 = '5m',
    M15 = '15m',
    H1 = '1h',
    H4 = '4h',
    D1 = '1d',
}

interface TradeEvent {
    price: number
    quantity: number
    side: Side
    executed_at: string
}

type Trade = TradeEvent

// WebSocket and API response types not in OpenAPI spec
interface Event {
    event_type: EventType
    available_balance: number
    available_asset_balance: number
    data: { [key: string]: any }
}

enum EventType {
    ORDER_PLACED = 'order_placed',
    ORDER_PARTIALLY_FILLED = 'order_partially_filled',
    ORDER_FILLED = 'order_filled',
    ORDER_CANCELLED = 'order_cancelled',
    ORDER_MODIFIED = 'order_modified',
    ORDER_MODIFY_REJECTED = 'order_modify_rejected',
    ORDER_REJECTED = 'order_rejected',
    NEW_TRADE = 'new_trade',
}

interface Instrument24h {
    h24_volume: number
    h24_change: number
    h24_high: number
    h24_low: number
}

interface UserOverviewResponse {
    cash_balance: number
    data: { [k: string]: number }
}

// Constants
const TIMEFRAME_SECONDS = {
    [TimeFrame.M5]: 5 * 60,
    [TimeFrame.M15]: 15 * 60,
    [TimeFrame.H1]: 60 * 60,
    [TimeFrame.H4]: 4 * 60 * 60,
    [TimeFrame.D1]: 24 * 60 * 60,
}
const FUTURES_TABS = ['positions', 'history'] as const
const SPOT_TABS = ['orders', 'history'] as const

// Types
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

type PriceData = { price: number | null; prevPrice: number | null }
type OrderBookData = { bids: PriceLevel[]; asks: PriceLevel[] }

type FuturesTab = (typeof FUTURES_TABS)[number]
type SpotTab = (typeof SPOT_TABS)[number]
type Tab = FuturesTab | SpotTab

// Hooks
const useScrollToTop = () => {
    const [showScrollToTop, setShowScrollToTop] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollToTop(window.scrollY > window.innerHeight)
        }

        document.addEventListener('scroll', handleScroll)
        return () => document.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0 })
    }, [])

    return { showScrollToTop, scrollToTop }
}

const useApiData = (instrument: string) => {
    const [instrumentSummary, setInstrumentSummary] =
        useState<Instrument24h | null>(null)
    const [balance, setBalance] = useState<number | null>(null)
    const [assetBalance, setAssetBalance] = useState<number | null>(null)
    const [events, setEvents] = useState<Log[]>([])

    const fetchInstrument24h = useCallback(async () => {
        try {
            const rsp = await fetch(
                `${HTTP_BASE_URL}/instruments/${instrument}/24h`
            )
            if (rsp.ok) {
                const data: Instrument24h = await rsp.json()
                setInstrumentSummary(data)
            }
        } catch (error) {
            console.error('Failed to fetch instrument summary:', error)
        }
    }, [])

    const fetchUserSummary = useCallback(async () => {
        try {
            const rsp = await fetch(`${HTTP_BASE_URL}/user/`, {
                credentials: 'include',
            })

            if (rsp.ok) {
                const data: UserOverviewResponse = await rsp.json()
                setBalance(data.cash_balance)
                setAssetBalance(data.data[instrument])
            }
        } catch (error) {
            console.error('Failed to fetch user summary:', error)
        }
    }, [])

    const fetchEvents = useCallback(async () => {
        try {
            const rsp = await fetch(`${HTTP_BASE_URL}/user/events`, {
                credentials: 'include',
            })

            if (rsp.ok) {
                const data: { event_type: EventType; order_id: string }[] =
                    await rsp.json()

                setEvents(
                    data.map((val) => ({
                        event_type: val.event_type,
                        message: `Order ID: ${val.order_id}`,
                    }))
                )
            }
        } catch (error) {
            console.error('Failed to fetch events:', error)
        }
    }, [])

    return {
        instrumentSummary,
        balance,
        assetBalance,
        events,
        setBalance,
        setAssetBalance,
        setEvents,
        fetchInstrumentSummary: fetchInstrument24h,
        fetchUserSummary,
        fetchEvents,
    }
}

const useCandles = (instrument: string, currentTimeFrame: TimeFrame) => {
    const [candles, setCandles] = useState<CandlestickData<Time>[]>([])
    const candlesRef = useRef<CandlestickData<Time>[]>([])
    const candleStickSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null)

    const fetchCandles = useCallback(async () => {
        try {
            const rsp = await fetch(
                `${HTTP_BASE_URL}/instruments/${instrument}/ohlc?timeframe=${currentTimeFrame}`
            )
            if (rsp.ok) {
                const data = await rsp.json()
                setCandles(data)
                candlesRef.current = data
            }
        } catch (error) {
            console.error('Failed to fetch candles:', error)
        }
    }, [currentTimeFrame])

    const handleIncomingPrice = useCallback(
        (value: number) => {
            if (!candleStickSeriesRef.current) return

            const curSeconds = Math.round(Date.now() / 1000)
            const tfSeconds = TIMEFRAME_SECONDS[currentTimeFrame]

            if (!candlesRef.current.length) {
                const time = curSeconds - (curSeconds % tfSeconds)
                const newCandle = {
                    open: value,
                    high: value,
                    low: value,
                    close: value,
                    time: time as Time,
                }
                candleStickSeriesRef.current.update(newCandle)
                candlesRef.current.push(newCandle)
                return
            }

            const prevCandle = candlesRef.current[candlesRef.current.length - 1]
            const prevTime = prevCandle.time as number
            const nextTime = prevTime + tfSeconds

            if (nextTime > curSeconds) {
                const updatedCandle = {
                    open: prevCandle.open,
                    high: Math.max(prevCandle.high, value),
                    low: Math.min(prevCandle.low, value),
                    close: value,
                    time: prevCandle.time,
                }
                candleStickSeriesRef.current.update(updatedCandle)
            } else {
                const newCandle = {
                    open: value,
                    high: value,
                    low: value,
                    close: value,
                    time: nextTime as Time,
                }
                candleStickSeriesRef.current.update(newCandle)
                candlesRef.current.push(newCandle)
            }
        },
        [currentTimeFrame]
    )

    useEffect(() => {
        fetchCandles()
    }, [fetchCandles])

    return {
        candles,
        candleStickSeriesRef,
        handleIncomingPrice,
    }
}

const useMarketData = (instrument: string) => {
    const [prices, setPrices] = useState<PriceData>({} as PriceData)
    const [orderBook, setOrderBook] = useState<OrderBookData>(
        {} as OrderBookData
    )
    const [recentTrades, setRecentTrades] = useState<Trade[]>([])

    const fetchRecentTrades = useCallback(async () => {
        try {
            const rsp = await fetch(
                `${HTTP_BASE_URL}/instruments/${instrument}/trades`
            )
            if (rsp.ok) {
                const data = await rsp.json()
                setRecentTrades(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch recent trades:', error)
        }
    }, [])

    const handleOrderBookSnapshot = useCallback((data: any) => {
        setOrderBook({
            bids: Object.entries(data.bids)
                .map(([k, v]) => ({
                    price: Number.parseFloat(k),
                    quantity: Number.parseInt(v as string),
                }))
                .reverse(),
            asks: Object.entries(data.asks).map(([k, v]) => ({
                price: Number.parseFloat(k),
                quantity: Number.parseInt(v as string),
            })),
        })
    }, [])

    const handleNewTradeEvent = useCallback((newTrade: Trade) => {
        setRecentTrades((prev) => {
            const newTrades = [...prev]
            if (newTrades.length === 10) {
                newTrades.pop()
            }
            newTrades.unshift(newTrade)
            return newTrades
        })
    }, [])

    useEffect(() => {
        fetchRecentTrades()
    }, [fetchRecentTrades])

    return {
        prices,
        orderBook,
        recentTrades,
        setPrices,
        handleOrderBookUpdate: handleOrderBookSnapshot,
        handleRecentTradeUpdate: handleNewTradeEvent,
    }
}

const useWebSocket = (
    instrument: string,
    handlePriceEvent: (price: number) => void,
    handleOrderBookEvent: (data: any) => void,
    handleTradeEvent: (trade: Trade) => void
) => {
    useEffect(() => {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/instruments/${instrument}`)

        const handleWsHeartbeat = async (ws: WebSocket) => {
            while (ws.readyState === WebSocket.OPEN) {
                // Max is 5 seconds.
                await new Promise((resolve) => setTimeout(resolve, 1000))
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping')
                }
            }
        }

        ws.onopen = () => {
            handleWsHeartbeat(ws)
            ws.send(JSON.stringify({ type: 'subscribe', channel: 'orderbook' }))
            ws.send(JSON.stringify({ type: 'subscribe', channel: 'trades' }))
            ws.send(JSON.stringify({ type: 'subscribe', channel: 'price' }))
        }

        ws.onmessage = (e) => {
            if (e.data === 'connected') return

            try {
                const msg = JSON.parse(e.data)

                switch (msg.event_type) {
                    case 'price':
                        handlePriceEvent(Number.parseFloat(msg.data.price))
                        break
                    case 'orderbook':
                        handleOrderBookEvent(msg.data)
                        break
                    case 'trades':
                        handleTradeEvent(msg.data)
                        break
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        return () => ws.close()
    }, [handlePriceEvent, handleOrderBookEvent, handleTradeEvent])
}

const useOrderManagement = (
    instrument: string,
    setEvents: React.Dispatch<React.SetStateAction<Log[]>>,
    setBalance: (balance: number) => void,
    setAssetBalance: (balance: number) => void
) => {
    const [wsToken, setWsToken] = useState<string | undefined>(undefined)
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus>('disconnected')
    const [openOrders, setOpenOrders] = useState<OrderRead[]>([])
    const [orderHistory, setOrderHistory] = useState<OrderRead[]>([])
    const hasNextRef = useRef<boolean>(true)
    const pageNumRef = useRef<number>(0)

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

                if (existingIndex >= 0) {
                    return prev.map((order, index) =>
                        index === existingIndex
                            ? { ...order, ...incomingOrder }
                            : order
                    )
                } else {
                    return [incomingOrder, ...prev]
                }
            })
        },
        []
    )

    const handleOrderRemoval = useCallback((orderId: string) => {
        setOpenOrders((prev) =>
            prev.filter((order) => order.order_id !== orderId)
        )
    }, [])

    const fetchOrderHistory = useCallback(async () => {
        const params = new URLSearchParams()
        params.append('page', pageNumRef.current.toString())
        params.append('instrument', instrument)
        params.append('order_by', 'desc')

        try {
            const rsp = await fetch(`${HTTP_BASE_URL}/orders?${params}`, {
                credentials: 'include',
            })

            if (rsp.ok) {
                const data: PaginatedResponseOrderRead = await rsp.json()
                setOrderHistory((prev) => [...prev, ...data.data])
                hasNextRef.current = data.has_next
            }
        } catch (error) {
            console.error('Failed to fetch order history:', error)
        }
    }, [])

    const fetchOpenOrders = useCallback(async () => {
        const params = new URLSearchParams()
        params.append('page', pageNumRef.current.toString())
        params.append('status', OrderStatus.pending)
        params.append('status', OrderStatus.placed)
        params.append('status', OrderStatus.partially_filled)
        params.append('instrument', instrument)
        params.append('order_by', 'desc')

        try {
            const rsp = await fetch(`${HTTP_BASE_URL}/orders?${params}`, {
                credentials: 'include',
            })

            if (rsp.ok) {
                const data: PaginatedResponseOrderRead = await rsp.json()
                setOpenOrders((prev) => [...prev, ...data.data])
                hasNextRef.current = data.has_next
            }
        } catch (error) {
            console.error('Failed to fetch open orders:', error)
        }
    }, [])

    const handleCloseAll = useCallback(async (action: 'close' | 'cancel') => {
        try {
            await fetch(`${HTTP_BASE_URL}/order`, {
                method: 'DELETE',
                credentials: 'include',
            })
        } catch (error) {
            console.error(`Failed to ${action} all orders:`, error)
        }
    }, [])

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const rsp = await fetch(`${HTTP_BASE_URL}/auth/access-token`, {
                    credentials: 'include',
                })
                if (rsp.ok) {
                    const data = await rsp.json()
                    setWsToken(data.access_token)
                }
            } catch (error) {
                console.error('Failed to fetch WebSocket token:', error)
            }
        }

        fetchToken()
    }, [])

    // Orders WebSocket
    useEffect(() => {
        if (!wsToken) return

        const ws = new WebSocket(`${WS_BASE_URL}/ws/orders`)

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
            ws.send(wsToken)
            handleWsHeartbeat(ws)
        }

        ws.onmessage = (e) => {
            if (e.data === 'connected') {
                setConnectionStatus('connected')
                return
            }

            const msg: Event = JSON.parse(e.data)
            const order = msg.data
            setBalance(msg.available_balance)
            setAssetBalance(msg.available_asset_balance)

            setEvents((prev: Log[]) => {
                const newEvents = [...prev]
                newEvents.unshift({
                    event_type: msg.event_type,
                    message: `Order ID: ${order.order_id}`,
                })
                return newEvents
            })

            if (
                [EventType.ORDER_CANCELLED, EventType.ORDER_FILLED].includes(
                    msg.event_type
                )
            ) {
                handleOrderRemoval(order.order_id)
                handleOrderUpdate(order as OrderRead, setOrderHistory)
            } else {
                handleOrderUpdate(order as OrderRead, setOpenOrders)
                handleOrderUpdate(order as OrderRead, setOrderHistory)
            }
        }

        ws.onclose = () => setConnectionStatus('disconnected')

        return () => ws.close()
    }, [wsToken, handleOrderUpdate, handleOrderRemoval, setEvents, setBalance])

    return {
        connectionStatus,
        openOrders,
        orderHistory,
        pageNumRef,
        hasNextRef,
        fetchOpenOrders,
        fetchOrderHistory,
        handleCloseAll,
    }
}

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
    const [currentTimeFrame, setCurrentTimeFrame] = useState<TimeFrame>(
        TimeFrame.M5
    )
    const [tableTab, setTableTab] = useState<Tab>('orders')

    // State management
    const [openOrders, setOpenOrders] = useState<OrderRead[]>([])
    const [orderHistory, setOrderHistory] = useState<OrderRead[]>([])
    const hasNextRef = useRef<boolean>(true)
    const pageNumRef = useRef<number>(0)

    // Custom hooks
    const { showScrollToTop, scrollToTop } = useScrollToTop()
    const {
        instrumentSummary,
        balance,
        assetBalance,
        events,
        setBalance,
        setAssetBalance,
        setEvents,
        fetchInstrumentSummary,
        fetchUserSummary,
        fetchEvents,
    } = useApiData(symbol!)

    const { candles, candleStickSeriesRef, handleIncomingPrice } = useCandles(
        symbol!,
        currentTimeFrame
    )

    const {
        prices,
        orderBook,
        recentTrades,
        handleOrderBookUpdate,
        handleRecentTradeUpdate,
    } = useMarketData(symbol!)

    const { connectionStatus } = useOrderManagement(
        symbol!,
        setEvents,
        setBalance,
        setAssetBalance
    )

    // WebSocket connections
    useWebSocket(
        symbol!,
        handleIncomingPrice,
        handleOrderBookUpdate,
        handleRecentTradeUpdate
    )

    // Order placed handler
    const handleOrderPlaced = useCallback((order: OrderRead) => {
        setOpenOrders((prev) => [order, ...prev])
    }, [])

    // Fetch functions
    const fetchOpenOrders = useCallback(async () => {
        const params = new URLSearchParams()
        params.append('page', pageNumRef.current.toString())
        params.append('status', OrderStatus.pending)
        params.append('status', OrderStatus.placed)
        params.append('status', OrderStatus.partially_filled)
        params.append('instrument', symbol!)
        params.append('order_by', 'desc')

        try {
            const rsp = await fetch(`${HTTP_BASE_URL}/orders?${params}`, {
                credentials: 'include',
            })

            if (rsp.ok) {
                const data: PaginatedResponseOrderRead = await rsp.json()
                setOpenOrders((prev) => [...prev, ...data.data])
                hasNextRef.current = data.has_next
            }
        } catch (error) {
            console.error('Failed to fetch open orders:', error)
        }
    }, [symbol])

    const fetchOrderHistory = useCallback(async () => {
        const params = new URLSearchParams()
        params.append('page', pageNumRef.current.toString())
        params.append('instrument', symbol!)
        params.append('order_by', 'desc')

        try {
            const rsp = await fetch(`${HTTP_BASE_URL}/orders?${params}`, {
                credentials: 'include',
            })

            if (rsp.ok) {
                const data: PaginatedResponseOrderRead = await rsp.json()
                setOrderHistory((prev) => [...prev, ...data.data])
                hasNextRef.current = data.has_next
            }
        } catch (error) {
            console.error('Failed to fetch order history:', error)
        }
    }, [symbol])

    useEffect(() => {
        document.body.classList.add('bg-zinc-900')

        fetchInstrumentSummary()
        fetchUserSummary()
        fetchEvents()

        return () => {
            document.body.classList.remove('bg-zinc-900')
        }
    }, [fetchInstrumentSummary, fetchUserSummary, fetchEvents])

    const handleTabChange = useCallback(
        (tab: Tab) => {
            pageNumRef.current = 1
            hasNextRef.current = true
            setTableTab(tab)
        },
        [pageNumRef]
    )

    const handleOpenOrdersScrollEnd = useCallback(() => {
        if (hasNextRef.current) {
            pageNumRef.current += 1
            fetchOpenOrders()
        }
    }, [fetchOpenOrders, pageNumRef])

    const handleHistoryScrollEnd = useCallback(() => {
        if (hasNextRef.current) {
            pageNumRef.current += 1
            fetchOrderHistory()
        }
    }, [fetchOrderHistory, pageNumRef])

    return (
        <>
            <div className="w-full h-auto flex pb-7">
                <Header />

                <main className="w-full min-h-screen mt-10 flex flex-row gap-1 p-1">
                    {/* Main Trading Area */}
                    <div className="w-[80%] flex flex-col gap-1">
                        {/* Chart and Market Data */}
                        <div className="h-150 max-h-150 flex flex-row gap-1">
                            <div className="h-150 grow-1 rounded-sm bg-background">
                                <ChartPanel
                                    {...(instrumentSummary ?? {})}
                                    {...prices}
                                    instrument={symbol!}
                                    candles={candles}
                                    seriesRef={candleStickSeriesRef}
                                    defaultTimeFrame={TimeFrame.M5}
                                    onTimeFrameChange={setCurrentTimeFrame}
                                    onInstrumentSelect={(
                                        instrument: string
                                    ) => {
                                        window.location.href = `/spot/${instrument}`
                                    }}
                                />
                            </div>
                            <div className="w-[20%] h-full flex flex-col gap-1 rounded-sm">
                                <div className="w-full h-1/2 pb-1 rounded-sm bg-background">
                                    <OrderBook {...orderBook} />
                                </div>
                                <div className="w-full h-1/2 rounded-sm bg-background overflow-y-scroll">
                                    <RecentTrades trades={recentTrades} />
                                </div>
                            </div>
                        </div>

                        {/* Tables Section */}
                        <div className="w-full flex flex-row gap-1">
                            <SpotTableCard
                                tab={tableTab as SpotTab}
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

            {/* Scroll to Top Button */}
            <div
                className={`fixed w-10 h-10 bottom-12 right-10 flex items-center justify-center rounded-full bg-gray-900 cursor-pointer transition-all duration-300 ${
                    showScrollToTop
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-100'
                }`}
                onClick={scrollToTop}
            >
                <ChevronUp className="size-5" />
            </div>
        </>
    )
}

export default TradingPage
