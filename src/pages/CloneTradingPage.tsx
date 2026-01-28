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

import { EventType } from '@/lib/types/apiTypes/eventType'
import type { Instrument24h } from '@/lib/types/apiTypes/instrumentSummary'
import type { Order } from '@/lib/types/apiTypes/order'
import { OrderStatus } from '@/lib/types/orderStatus'
import { OrderType } from '@/lib/types/orderType'
import { Side } from '@/lib/types/side'
import { TimeFrame } from '@/lib/types/timeframe'
import type { TradeEvent as Trade } from '@/lib/types/tradeEvent'
import {
    type CandlestickData,
    type ISeriesApi,
    type Time,
} from 'lightweight-charts'
import { ChevronUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FC } from 'react'

// Constants
const SPOT_TABS = ['orders', 'history'] as const

// Types
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'
type SpotTab = (typeof SPOT_TABS)[number]

// Dummy Data Generation
const generateDummyCandles = (): CandlestickData<Time>[] => {
    const candles: CandlestickData<Time>[] = []
    const baseTime = Math.floor(Date.now() / 1000) - 100 * 5 * 60
    let price = 0.65

    for (let i = 0; i < 100; i++) {
        const open = price
        const volatility = 0.02
        const change = (Math.random() - 0.48) * volatility
        const high = open + Math.random() * volatility
        const low = open - Math.random() * volatility
        const close = open + change

        candles.push({
            time: (baseTime + i * 5 * 60) as Time,
            open: Number(open.toFixed(4)),
            high: Number(Math.max(open, close, high).toFixed(4)),
            low: Number(Math.min(open, close, low).toFixed(4)),
            close: Number(close.toFixed(4)),
        })

        price = close
    }

    return candles
}

const generateDummyOrderBook = (): {
    bids: PriceLevel[]
    asks: PriceLevel[]
} => {
    const midPrice = 0.6523
    const bids: PriceLevel[] = []
    const asks: PriceLevel[] = []

    for (let i = 0; i < 12; i++) {
        bids.push({
            price: Number((midPrice - 0.0001 * (i + 1)).toFixed(4)),
            quantity: Math.floor(Math.random() * 5000) + 500,
        })
        asks.push({
            price: Number((midPrice + 0.0001 * (i + 1)).toFixed(4)),
            quantity: Math.floor(Math.random() * 5000) + 500,
        })
    }

    return { bids, asks }
}

const generateDummyRecentTrades = (): Trade[] => {
    const trades: Trade[] = []
    const baseTime = Date.now()

    for (let i = 0; i < 10; i++) {
        const isBuy = Math.random() > 0.5
        trades.push({
            price: Number((0.65 + (Math.random() - 0.5) * 0.01).toFixed(4)),
            quantity: Math.floor(Math.random() * 1000) + 100,
            side: isBuy ? Side.BID : Side.ASK,
            // executed_at: new Date(baseTime - i * 30000).toDateString(),
            executed_at: new Date(
                Number.parseInt(baseTime.toFixed()) - i * 6000
            ),
        })
    }

    return trades
}

const generateDummyEvents = (): Log[] => {
    return [
        {
            event_type: EventType.ORDER_FILLED,
            message: 'Order ID: ord_8f2a1b3c',
        },
        {
            event_type: EventType.ORDER_PLACED,
            message: 'Order ID: ord_7e9d4c5a',
        },
        {
            event_type: EventType.ORDER_PARTIALLY_FILLED,
            message: 'Order ID: ord_6b8c3d2e',
        },
        {
            event_type: EventType.ORDER_FILLED,
            message: 'Order ID: ord_5a7b2c1d',
        },
        {
            event_type: EventType.ORDER_PLACED,
            message: 'Order ID: ord_4c6a1b9e',
        },
        {
            event_type: EventType.ORDER_CANCELLED,
            message: 'Order ID: ord_3d5e8f7a',
        },
        {
            event_type: EventType.ORDER_FILLED,
            message: 'Order ID: ord_2e4d7c6b',
        },
        {
            event_type: EventType.ORDER_PLACED,
            message: 'Order ID: ord_1f3c6b5a',
        },
    ]
}

const generateDummyOpenOrders = (): Order[] => {
    return [
        {
            order_id: 'ord_8f2a1b3c',
            instrument_id: 'TRUMP-USD',
            side: Side.BID,
            order_type: OrderType.LIMIT,
            price: 0.645,
            quantity: 500,
            filled_quantity: 0,
            status: OrderStatus.PLACED,
            created_at: new Date(Date.now() - 300000).toISOString(),
            updated_at: new Date(Date.now() - 300000).toISOString(),
        },
        {
            order_id: 'ord_7e9d4c5a',
            instrument_id: 'TRUMP-USD',
            side: Side.ASK,
            order_type: OrderType.LIMIT,
            price: 0.66,
            limit_price: null,
            stop_price: null,
            avg_fill_price: null,
            quantity: 300,
            executed_quantity: 0,
            status: OrderStatus.PLACED,
            created_at: new Date(Date.now() - 600000).toISOString(),
            // updated_at: new Date(Date.now() - 600000).toISOString(),
        },
        {
            order_id: 'ord_6b8c3d2e',
            instrument: 'TRUMP-USD',
            side: Side.BID,
            order_type: OrderType.LIMIT,
            price: 0.64,
            quantity: 1000,
            filled_quantity: 250,
            status: OrderStatus.PARTIALLY_FILLED,
            created_at: new Date(Date.now() - 900000).toISOString(),
            updated_at: new Date(Date.now() - 450000).toISOString(),
        },
    ]
}

const generateDummyOrderHistory = (): Order[] => {
    return [
        {
            order_id: 'ord_5a7b2c1d',
            instrument: 'TRUMP-USD',
            side: Side.BID,
            order_type: OrderType.MARKET,
            price: 0.652,
            quantity: 200,
            filled_quantity: 200,
            status: OrderStatus.FILLED,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            updated_at: new Date(Date.now() - 1795000).toISOString(),
        },
        {
            order_id: 'ord_4c6a1b9e',
            instrument: 'TRUMP-USD',
            side: Side.ASK,
            order_type: OrderType.LIMIT,
            price: 0.658,
            quantity: 450,
            filled_quantity: 450,
            status: OrderStatus.FILLED,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3500000).toISOString(),
        },
        {
            order_id: 'ord_3d5e8f7a',
            instrument: 'TRUMP-USD',
            side: Side.BID,
            order_type: OrderType.LIMIT,
            price: 0.63,
            quantity: 800,
            filled_quantity: 0,
            status: OrderStatus.CANCELLED,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 5400000).toISOString(),
        },
        {
            order_id: 'ord_2e4d7c6b',
            instrument: 'TRUMP-USD',
            side: Side.ASK,
            order_type: OrderType.MARKET,
            price: 0.649,
            quantity: 150,
            filled_quantity: 150,
            status: OrderStatus.FILLED,
            created_at: new Date(Date.now() - 10800000).toISOString(),
            updated_at: new Date(Date.now() - 10795000).toISOString(),
        },
        {
            order_id: 'ord_1f3c6b5a',
            instrument: 'TRUMP-USD',
            side: Side.BID,
            order_type: OrderType.LIMIT,
            price: 0.64,
            quantity: 600,
            filled_quantity: 600,
            status: OrderStatus.FILLED,
            created_at: new Date(Date.now() - 14400000).toISOString(),
            updated_at: new Date(Date.now() - 14000000).toISOString(),
        },
    ]
}

const dummyInstrumentSummary: Instrument24h = {
    instrument: 'TRUMP-USD',
    price_change: 0.0234,
    price_change_percent: 3.72,
    high: 0.6789,
    low: 0.6201,
    volume: 1247853,
    quote_volume: 812456.32,
}

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

const SpotTableCard: FC<{
    tab: SpotTab
    openOrders: Order[]
    orderHistory: Order[]
    handleTabChange: (value: SpotTab) => void
    handleOpenOrdersScrollEnd: () => void
    handleHistoryScrollEnd: () => void
}> = ({
    tab,
    openOrders,
    orderHistory,
    handleTabChange,
    handleOpenOrdersScrollEnd,
    handleHistoryScrollEnd,
}) => {
    return (
        <div className="w-full bg-background rounded-sm p-1">
            <div className="w-full flex justify-between px-3">
                <div className="w-full mb-2 flex items-center justify-start p-3">
                    {SPOT_TABS.map((t) => (
                        <Button
                            key={t}
                            type="button"
                            className={`bg-transparent hover:bg-transparent rounded-none border-b-2 hover:text-white cursor-pointer ${
                                tab === t
                                    ? 'border-b-white text-white'
                                    : 'border-b-transparent text-neutral-900'
                            }`}
                            onClick={() => handleTabChange(t)}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="w-full p-3">
                {tab === 'orders' && (
                    <OpenOrdersTable
                        orders={openOrders}
                        onScrollEnd={handleOpenOrdersScrollEnd}
                        showActions
                    />
                )}
                {tab === 'history' && (
                    <OrderHistoryTable
                        orders={orderHistory}
                        onScrollEnd={handleHistoryScrollEnd}
                    />
                )}
            </div>
        </div>
    )
}

// Main Component
const CloneTradingPage: FC = () => {
    const instrument = 'TRUMP-USD'
    const [currentTimeFrame, setCurrentTimeFrame] = useState<TimeFrame>(
        TimeFrame.M5
    )
    const [tableTab, setTableTab] = useState<SpotTab>('orders')

    // Static dummy data
    const [candles] = useState<CandlestickData<Time>[]>(generateDummyCandles)
    const [orderBook] = useState(generateDummyOrderBook)
    const [recentTrades] = useState<Trade[]>(generateDummyRecentTrades)
    const [events] = useState<Log[]>(generateDummyEvents)
    const [openOrders] = useState<Order[]>(generateDummyOpenOrders)
    const [orderHistory] = useState<Order[]>(generateDummyOrderHistory)
    const [balance] = useState<number>(10000.0)
    const [assetBalance] = useState<number>(2500)
    const [connectionStatus] = useState<ConnectionStatus>('connected')
    const [prices] = useState({ price: 0.6523, prevPrice: 0.6498 })

    const candleStickSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null)

    const { showScrollToTop, scrollToTop } = useScrollToTop()

    useEffect(() => {
        document.body.classList.add('bg-zinc-900')
        return () => {
            document.body.classList.remove('bg-zinc-900')
        }
    }, [])

    const handleTabChange = useCallback((tab: SpotTab) => {
        setTableTab(tab)
    }, [])

    const handleOpenOrdersScrollEnd = useCallback(() => {}, [])
    const handleHistoryScrollEnd = useCallback(() => {}, [])

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
                                    {...dummyInstrumentSummary}
                                    {...prices}
                                    instrument={instrument}
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
                                instrument={instrument}
                                setBalance={() => {}}
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

export default CloneTradingPage
