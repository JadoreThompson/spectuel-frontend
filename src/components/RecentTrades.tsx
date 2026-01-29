import { Side } from '@/openapi'
import type { FC } from 'react'

interface TradeEvent {
    price: number
    quantity: number
    side: Side
    executed_at: string
}

const RecentTrades: FC<{ trades: TradeEvent[] }> = ({ trades }) => {
    const formatDate = (value: string) => {
        const date = new Date(value)
        console.log(date)
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    }

    return (
        <div className="p-4 w-full">
            <h3 className="mb-2 font-semibold text-sm">Recent Trades</h3>
            <div className="space-y-1">
                {trades.map((t, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                        <span
                            className={
                                t.side === Side.bid
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            }
                        >
                            {t.price.toFixed(2)}
                        </span>
                        <span>{t.quantity}</span>
                        <span className="text-gray-500">
                            {formatDate(t.executed_at)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default RecentTrades
