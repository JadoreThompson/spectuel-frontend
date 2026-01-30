import { WS_BASE_URL } from '@/config'
import {
    getMarketBarsMarketsSymbolBarsGet,
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
    }, [options.onBarUpdate, options.onTrade, options.onOrderbookSnapshot, options.onError])

    useEffect(() => {
        subscriptionRef.current = options.subscription
    }, [options.subscription])

    useEffect(() => {
        const ws = new WebSocket(`${WS_BASE_URL}/ws/markets`)
        wsRef.current = ws

        ws.onopen = () => {
            setIsConnected(true)
            if (subscriptionRef.current) {
                ws.send(
                    JSON.stringify({
                        type: 'subscribe',
                        ...subscriptionRef.current,
                    })
                )
            }
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                switch (data.type) {
                    case 'bar_update':
                        onBarUpdateRef.current?.(data as BarUpdateEvent)
                        break
                    case 'new_trade':
                        onTradeRef.current?.(data as TradeEvent)
                        break
                    case 'orderbook_snapshot':
                        onOrderbookSnapshotRef.current?.(data as OrderbookSnapshot)
                        break
                    case 'error':
                        onErrorRef.current?.(data.message)
                        break
                    case 'ack':
                        // Subscription acknowledged
                        break
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
