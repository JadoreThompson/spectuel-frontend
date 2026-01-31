import { WS_BASE_URL } from '@/config'
import {
    getMarketBarsMarketsSymbolBarsGet,
    getMarketStatsMarketsSymbolStatsGet,
    getMarketSymbolsMarketsSymbolsGet,
    type GetMarketBarsMarketsSymbolBarsGetParams,
} from '@/openapi'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

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

// Get Market Symbols Query
export const useGetMarketSymbolsQuery = () => {
    return useQuery({
        queryKey: ['marketSymbols'],
        queryFn: () => getMarketSymbolsMarketsSymbolsGet(),
    })
}

// Get Market Stats Query
export const useGetMarketStatsQuery = (symbol: string) => {
    return useQuery({
        queryKey: ['marketStats', symbol],
        queryFn: () => getMarketStatsMarketsSymbolStatsGet(symbol),
        enabled: !!symbol,
    })
}

// WebSocket Types
export interface BarUpdateEvent {
    type: 'bar_update'
    symbol: string
    timeframe: string
    timestamp: number
    open: number
    high: number
    low: number
    close: number
}

export interface TradeEvent {
    type: 'new_trade'
    symbol: string
    price: number
    quantity: number
    timestamp: number
    side: 'buy' | 'sell'
}

export interface OrderbookSnapshot {
    type: 'orderbook_snapshot'
    symbol: string
    bids: [number, number][]
    asks: [number, number][]
}

export interface BarSubscription {
    symbol: string
    timeframes: string[]
}

export interface MarketSubscription {
    orderbooks?: string[]
    trades?: string[]
    bars?: BarSubscription[]
}

export interface UseMarketsWebSocketOptions {
    subscription?: MarketSubscription
    onBarUpdate?: (bar: BarUpdateEvent) => void
    onTrade?: (trade: TradeEvent) => void
    onOrderbookSnapshot?: (orderbook: OrderbookSnapshot) => void
    onError?: (error: string) => void
}

// Markets WebSocket Hook
export const useMarketsWebSocket = (options: UseMarketsWebSocketOptions) => {
    const [isConnected, setIsConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const subscriptionRef = useRef<MarketSubscription | undefined>(
        options.subscription
    )

    // Store callbacks in refs to avoid recreating WebSocket on every render
    const onBarUpdateRef = useRef(options.onBarUpdate)
    const onTradeRef = useRef(options.onTrade)
    const onOrderbookSnapshotRef = useRef(options.onOrderbookSnapshot)
    const onErrorRef = useRef(options.onError)

    useEffect(() => {
        onBarUpdateRef.current = options.onBarUpdate
        onTradeRef.current = options.onTrade
        onOrderbookSnapshotRef.current = options.onOrderbookSnapshot
        onErrorRef.current = options.onError
    }, [
        options.onBarUpdate,
        options.onTrade,
        options.onOrderbookSnapshot,
        options.onError,
    ])

    useEffect(() => {
        subscriptionRef.current = options.subscription
    }, [options.subscription])

    useEffect(() => {
        console.log(
            'Initializing markets WebSocket connection to:',
            `${WS_BASE_URL}/ws/markets`
        )
        const ws = new WebSocket(`${WS_BASE_URL}/ws/markets`)
        wsRef.current = ws

        ws.onopen = () => {
            console.log('Markets WebSocket connected')
            setIsConnected(true)
            if (subscriptionRef.current) {
                const subscriptionMessage = {
                    type: 'subscribe',
                    ...subscriptionRef.current,
                }
                console.log('Sending subscription:', subscriptionMessage)
                ws.send(JSON.stringify(subscriptionMessage))
            }
        }

        ws.onmessage = (event) => {
            console.log('Received event: ', event)
            try {
                const data = JSON.parse(event.data)
                console.log('Parsed data:', data)
                console.log('Event type:', data.type)

                switch (data.type) {
                    case 'instrument_bar_update':
                        console.log('Calling onBarUpdate with:', data)
                        onBarUpdateRef.current?.(data as BarUpdateEvent)
                        break
                    case 'instrument_new_trade':
                        console.log('Calling onTrade with:', data)
                        onTradeRef.current?.(data as TradeEvent)
                        break
                    case 'instrument_orderbook_snapshot':
                        console.log('Calling onOrderbookSnapshot with:', data)
                        onOrderbookSnapshotRef.current?.(
                            data as OrderbookSnapshot
                        )
                        break
                    case 'error':
                        console.error('WebSocket error message:', data.message)
                        onErrorRef.current?.(data.message)
                        break
                    case 'ack':
                        console.log('Subscription acknowledged')
                        break
                    default:
                        console.log('Unknown event type:', data.type)
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            onErrorRef.current?.('WebSocket connection error')
        }

        ws.onclose = () => {
            console.log('Disconnected from markets websocket')
            setIsConnected(false)
        }

        return () => {
            ws.close()
        }
    }, [])

    const updateSubscription = (subscription: MarketSubscription) => {
        subscriptionRef.current = subscription
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'subscribe',
                    ...subscription,
                })
            )
        }
    }

    return {
        isConnected,
        updateSubscription,
    }
}
