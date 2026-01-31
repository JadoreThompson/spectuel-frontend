import { useCreateOrderMutation } from '@/hooks/order-hooks'
import { cn } from '@/lib/utils'
import { OrderType, Side, StrategyType, type OrderRead } from '@/openapi'
import React, { useState, type FC } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

const SpotOrderForm: FC<{
    balance?: number | null
    assetBalance?: number | null
    symbol: string
    setBalance: React.Dispatch<React.SetStateAction<number>>
    onOrderPlaced: (order: OrderRead) => void
}> = (props) => {
    const [side, setSide] = useState<Side>(Side.bid)
    const [orderType, setOrderType] = useState<OrderType>(OrderType.limit)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const createOrderMutation = useCreateOrderMutation()

    const sideColor =
        side === Side.bid
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'

    const handleFormSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault()
        setErrorMsg(null)

        const formData = new FormData(e.currentTarget)
        const quantity = parseFloat(formData.get('quantity') as string)
        const price = parseFloat(formData.get('price') as string)

        try {
            const orderData = {
                order_type: orderType,
                side: side,
                quantity: quantity,
                limit_price: orderType === OrderType.limit ? price : null,
                stop_price: orderType === OrderType.stop ? price : null,
                strategy_type: StrategyType.single,
                symbol: props.symbol,
            }

            const response = await createOrderMutation.mutateAsync(orderData)

            if (response.status === 202) {
                props.onOrderPlaced(response.data.order)
            }
        } catch (error: any) {
            const errorMessage =
                error?.data?.error ||
                error?.message ||
                'An unknown error occurred'
            setErrorMsg(errorMessage)
        }
    }

    return (
        <div className="min-h-[600px]">
            <form onSubmit={handleFormSubmit} className="w-full">
                <div className="w-full rounded-xl border-none p-4">
                    <Tabs
                        defaultValue={side}
                        onValueChange={(val) => setSide(val as Side)}
                    >
                        <TabsList className="flex items-center w-full mb-4">
                            <TabsTrigger
                                type="button"
                                value={Side.bid}
                                className="rounded-l-md data-[state=active]:bg-green-600 data-[state=active]:text-white bg-transparent cursor-pointer"
                            >
                                Buy
                            </TabsTrigger>
                            <TabsTrigger
                                type="button"
                                value={Side.ask}
                                className="rounded-r-md data-[state=active]:bg-red-600 data-[state=active]:text-white cursor-pointer"
                            >
                                Sell
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">
                            Order Type
                        </label>
                        <Select
                            value={orderType}
                            onValueChange={(value) =>
                                setOrderType(value as OrderType)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select order type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={OrderType.limit}>
                                    Limit
                                </SelectItem>
                                <SelectItem value={OrderType.stop}>
                                    Stop
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4 mb-2">
                        <div>
                            <label className="text-xs text-muted-foreground">
                                {orderType === OrderType.limit
                                    ? 'Limit Price'
                                    : 'Stop Price'}
                            </label>
                            <Input
                                type="number"
                                name="price"
                                placeholder="0.00"
                                className="h-9"
                                step={0.01}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Quantity</span>
                                {side === Side.bid ? (
                                    <span>
                                        Available:{' '}
                                        {typeof props.balance === 'number'
                                            ? props.balance.toFixed(2)
                                            : '-'}{' '}
                                        USDT
                                    </span>
                                ) : (
                                    <span>
                                        Available:{' '}
                                        {typeof props.assetBalance === 'number'
                                            ? props.assetBalance.toFixed(2)
                                            : '-'}{' '}
                                        {props.symbol}
                                    </span>
                                )}
                            </div>
                            <Input
                                type="number"
                                name="quantity"
                                placeholder="0.00"
                                className="h-9"
                                step="any"
                                required
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="w-full text-center mb-2">
                            <span className="text-red-500 text-sm">
                                {errorMsg}
                            </span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={
                            props.balance === null ||
                            createOrderMutation.isPending
                        }
                        className={cn(
                            'w-full text-white cursor-pointer',
                            sideColor
                        )}
                    >
                        {createOrderMutation.isPending
                            ? 'Submitting...'
                            : `${side === Side.bid ? 'Buy' : 'Sell'} ${orderType === OrderType.limit ? 'Limit' : 'Stop'}`}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default SpotOrderForm
