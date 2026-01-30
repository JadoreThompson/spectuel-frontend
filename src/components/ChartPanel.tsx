import {
    useGetMarketBarsQuery,
    type BarUpdateEvent,
} from '@/hooks/market-hooks'
import { TimeFrame as TimeFrameEnum } from '@/openapi'
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

const TimeFrame = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
} as const

type TimeFrame = (typeof TimeFrame)[keyof typeof TimeFrame]

const ChartPanel: FC<{
    symbol: string
    price?: number | null
    prevPrice?: number | null
    h24_change?: number | null
    h24_high?: number | null
    h24_low?: number | null
    h24_volume?: number | null
    defaultTimeFrame?: TimeFrame
    onInstrumentSelect: (symbol: string) => void
    barUpdate?: BarUpdateEvent | null
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

    // Fetch historical bars
    const barsQuery = useGetMarketBarsQuery(props.symbol, {
        timeframe: timeFrame as TimeFrameEnum,
    })

    // Handle bar updates from parent component
    useEffect(() => {
        if (!props.barUpdate) return
        if (
            props.barUpdate.symbol !== props.symbol ||
            props.barUpdate.timeframe !== timeFrame
        )
            return

        if (seriesRef.current) {
            seriesRef.current.update({
                time: props.barUpdate.timestamp as Time,
                open: props.barUpdate.open,
                high: props.barUpdate.high,
                low: props.barUpdate.low,
                close: props.barUpdate.close,
            })
        }
    }, [props.barUpdate, props.symbol, timeFrame])

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

    // Update chart data when bars are fetched
    useEffect(() => {
        if (barsQuery.data?.status === 200 && seriesRef.current) {
            const bars = barsQuery.data.data.bars
            const candleData: CandlestickData<Time>[] = bars.map((bar) => ({
                time: bar.timestamp as Time,
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
            }))

            seriesRef.current.setData(candleData)
            setIsLoading(false)
        }
    }, [barsQuery.data])

    // Refetch when symbol or timeframe changes
    useEffect(() => {
        setIsLoading(true)
    }, [props.symbol, timeFrame])

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
                                typeof props.price == 'number' &&
                                typeof props.prevPrice === 'number'
                                    ? props.price >= props.prevPrice
                                        ? 'text-[var(--green)]'
                                        : 'text-[var(--red)]'
                                    : ''
                            }
                        `}
                        >
                            {typeof props.price === 'number'
                                ? props.price
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
                                typeof props.h24_change === 'number'
                                    ? props.h24_change >= 0
                                        ? 'text-[var(--green)]'
                                        : 'text-[var(--red)]'
                                    : ''
                            }
                        `}
                        >
                            {typeof props.h24_change === 'number'
                                ? `${props.h24_change.toFixed(2)}%`
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
                            {typeof props.h24_high === 'number'
                                ? props.h24_high.toFixed(2)
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
                            {typeof props.h24_low === 'number'
                                ? props.h24_low.toFixed(2)
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
                            {typeof props.h24_volume === 'number'
                                ? props.h24_volume.toFixed(2)
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
export default ChartPanel
