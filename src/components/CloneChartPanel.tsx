import { TimeFrame } from '@/openapi'
import {
    CandlestickSeries,
    ColorType,
    createChart,
    type CandlestickData,
    type IChartApi,
    type ISeriesApi,
    type Time,
} from 'lightweight-charts'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type FC, type RefObject } from 'react'
import InstrumentSelector from './InstrumentSelector'
import Logo from './Logo'
import { Button } from './ui/button'

// Generate dummy candles
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

const CloneChartPanel: FC<{
    symbol: string
    price?: number | null
    prevPrice?: number | null
    h24_change?: number | null
    h24_high?: number | null
    h24_low?: number | null
    h24_volume?: number | null
    defaultTimeFrame?: TimeFrame
    onInstrumentSelect: (symbol: string) => void
}> = (props) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const [timeFrame, setTimeFrame] = useState<TimeFrame>(
        props.defaultTimeFrame || '5m'
    )
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false)
    const triggerRef = useRef<HTMLDivElement>(null)

    // Static dummy data instead of API calls
    const [dummyCandles] = useState<CandlestickData<Time>[]>(
        generateDummyCandles
    )

    // Initialize chart
    useEffect(() => {
        if (!containerRef.current) return

        if (!chartRef.current) {
            chartRef.current = createChart(containerRef.current, {
                autoSize: true,
                layout: {
                    background: {
                        type: ColorType.Solid,
                        color: 'transparent',
                    },
                    textColor: 'white',
                },
                grid: {
                    vertLines: { color: '#151515' },
                    horzLines: { color: '#151515' },
                },
                timeScale: {
                    timeVisible: true,
                },
            })
        }

        if (!seriesRef.current) {
            seriesRef.current = chartRef.current.addSeries(CandlestickSeries)
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.remove()
                chartRef.current = null
                seriesRef.current = null
            }
        }
    }, [])

    // Update chart data with dummy candles
    useEffect(() => {
        if (seriesRef.current && dummyCandles.length > 0) {
            seriesRef.current.setData(dummyCandles)
            setIsLoading(false)
        }
    }, [dummyCandles])

    // Calculate display price - use last candle's close if price prop is null/undefined
    const displayPrice =
        props.price ??
        (dummyCandles.length > 0
            ? dummyCandles[dummyCandles.length - 1].close
            : null)

    // Use props directly for stats (no API calls)
    const h24_change = props.h24_change
    const h24_high = props.h24_high
    const h24_low = props.h24_low
    const h24_volume = props.h24_volume

    return (
        <div className="w-full h-full flex flex-col p-5 gap-1">
            <div className="w-full h-15 flex flex-row items-center justify-start">
                <div
                    ref={triggerRef}
                    onMouseUp={() => setIsSelectorOpen(!isSelectorOpen)}
                    className="w-fit h-full flex items-center px-2 text-left border-r border-neutral-800 cursor-pointer"
                >
                    <div className="flex flex-col pr-2">
                        <span className="font-bold text-sm whitespace-nowrap">
                            {props.symbol}
                        </span>
                        <span
                            className={`
                            font-semibold
                            ${
                                typeof displayPrice == 'number' &&
                                typeof props.prevPrice === 'number'
                                    ? displayPrice >= props.prevPrice
                                        ? 'text-[var(--green)]'
                                        : 'text-[var(--red)]'
                                    : ''
                            }
                        `}
                        >
                            {typeof displayPrice === 'number'
                                ? displayPrice
                                : '-'}
                        </span>
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <InstrumentSelector
                    isOpen={isSelectorOpen}
                    onClose={() => setIsSelectorOpen(false)}
                    onSelect={props.onInstrumentSelect}
                    triggerRef={triggerRef as RefObject<HTMLDivElement>}
                />

                <div className="w-30 h-full flex items-center justify-center px-2 ">
                    <div className="flex flex-col">
                        <span className="font-bold text-right text-sm text-neutral-500">
                            24h Change
                        </span>
                        <span
                            className={`
                            text-right
                            font-semibold
                            text-sm
                            ${
                                typeof h24_change === 'number'
                                    ? h24_change >= 0
                                        ? 'text-[var(--green)]'
                                        : 'text-[var(--red)]'
                                    : ''
                            }
                        `}
                        >
                            {typeof h24_change === 'number'
                                ? `${h24_change.toFixed(2)}%`
                                : '-'}
                        </span>
                    </div>
                </div>

                <div className="w-30 h-full flex items-center justify-center px-2 ">
                    <div className="flex flex-col">
                        <span className="font-bold text-right text-sm text-neutral-500">
                            24h High
                        </span>
                        <span className="text-right font-semibold text-sm">
                            {typeof h24_high === 'number'
                                ? h24_high.toFixed(2)
                                : '-'}
                        </span>
                    </div>
                </div>

                <div className="w-30 h-full flex items-center justify-center px-2  ">
                    <div className="flex flex-col">
                        <span className="font-bold text-right text-sm text-neutral-500">
                            24h Low
                        </span>
                        <span className="text-right font-semibold text-sm">
                            {typeof h24_low === 'number'
                                ? h24_low.toFixed(2)
                                : '-'}
                        </span>
                    </div>
                </div>

                <div className="w-30 h-full flex items-center justify-center px-2 ">
                    <div className="flex flex-col">
                        <span className="font-bold text-right text-sm text-neutral-500">
                            24h Volume
                        </span>
                        <span className="text-right font-semibold text-sm">
                            {typeof h24_volume === 'number'
                                ? h24_volume.toFixed(2)
                                : '-'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="w-full h-10 flex flex-row items-center justify-start gap-3">
                {Object.values(TimeFrame).map((val) => (
                    <Button
                        key={val}
                        type="button"
                        className={`bg-transparent hover:bg-transparent rounded-none border-b-1 border-b-transparent cursor-pointer transition-border-b duration-300 ${timeFrame === val ? 'border-b-blue-500 text-white' : 'hover:border-b-blue-600 text-neutral-900'}`}
                        onClick={() => setTimeFrame(val as TimeFrame)}
                    >
                        {val}
                    </Button>
                ))}
            </div>
            <div
                ref={containerRef}
                className="w-full flex-1 relative text-center"
            >
                {isLoading && (
                    <div className="z-[3] absolute top-0 left-0 w-full h-full flex items-center justify-center bg-background">
                        <Logo />
                    </div>
                )}
            </div>
        </div>
    )
}
export default CloneChartPanel
