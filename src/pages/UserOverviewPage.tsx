import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    useGetAssetBalancesQuery,
    useGetUserOverviewQuery,
} from '@/hooks/user-hooks'
import { type AssetBalanceItem } from '@/openapi'
import { ChevronUp } from 'lucide-react'
import { useEffect, useState, type FC } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

// Types
type UserOverview = {
    cash_balance: number
    portfolio_balance: number
    data: { [key: string]: number }
}
const tableTabs = ['balances']
type Tab = (typeof tableTabs)[number]

// Colors for pie chart
const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
    '#FFC658',
    '#FF6B9D',
]

const AssetPieChart: FC = () => {
    const assetBalancesQuery = useGetAssetBalancesQuery()

    const chartData =
        assetBalancesQuery.data?.status === 200
            ? assetBalancesQuery.data.data
                  .filter((item) => item.balance - item.escrow_balance > 0)
                  .map((item) => ({
                      name: item.symbol,
                      value: item.balance - item.escrow_balance,
                  }))
            : []

    return (
        <div className="w-full h-full flex flex-col bg-transparent border-none">
            <div className="flex items-center gap-2 space-y-0 sm:flex-row mb-4">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                        Asset Distribution
                    </h2>
                    <p className="text-sm text-gray-500">
                        Portfolio allocation by asset
                    </p>
                </div>
            </div>
            <div className="flex-1 w-full">
                {assetBalancesQuery.isLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No asset balances to display
                    </div>
                )}
            </div>
        </div>
    )
}

const AssetBalanceTable: FC<{ balances: AssetBalanceItem[] }> = ({
    balances,
}) => {
    return (
        <div className="w-full overflow-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                            Symbol
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                            Available Balance
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {balances.length > 0 ? (
                        balances.map((balance, index) => (
                            <tr
                                key={index}
                                className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                            >
                                <td className="text-left py-3 px-4 text-sm text-white">
                                    {balance.symbol}
                                </td>
                                <td className="text-right py-3 px-4 text-sm text-white">
                                    {(
                                        balance.balance - balance.escrow_balance
                                    ).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 8,
                                    })}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={2}
                                className="text-center py-8 text-gray-500"
                            >
                                No asset balances available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

const UserOverviewPage: FC = () => {
    const [tableTab, setTableTab] = useState<Tab>('balances')
    const [showScrollToTop, setShowScollToTop] = useState<boolean>(false)

    // React Query hooks
    const userOverviewQuery = useGetUserOverviewQuery()
    const assetBalancesQuery = useGetAssetBalancesQuery()

    useEffect(() => {
        const scrollEvent = () =>
            setShowScollToTop(window.scrollY > window.innerHeight)

        document.body.classList.add('bg-zinc-900')
        document.addEventListener('scroll', scrollEvent)

        return () => {
            document.body.classList.remove('bg-zinc-900')
            document.removeEventListener('scroll', () => scrollEvent)
        }
    }, [])

    const userOverview =
        userOverviewQuery.data?.status === 200
            ? (userOverviewQuery.data.data as UserOverview)
            : undefined

    const assetBalances =
        assetBalancesQuery.data?.status === 200
            ? assetBalancesQuery.data.data
            : []

    return (
        <>
            <Header />
            <main className="mt-11 pb-5">
                <div className="max-w-5xl h-fit mx-auto">
                    <section className="w-full mb-1">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex flex-col justify-between min-w-[300px] max-w-full h-fit max-h-fit bg-background border border-zinc-800 rounded-xl px-6 py-5">
                                {/* Balance */}
                                <div className="flex flex-col mb-3">
                                    <span className="text-xs text-zinc-400 uppercase tracking-wide">
                                        Portfolio Balance
                                    </span>
                                    {userOverview ? (
                                        <span className="text-2xl font-bold text-white">
                                            $
                                            {userOverview.portfolio_balance.toLocaleString(
                                                undefined,
                                                { minimumFractionDigits: 2 }
                                            )}
                                        </span>
                                    ) : (
                                        <Skeleton className="w-32 h-10 mt-2" />
                                    )}
                                </div>
                            </div>

                            {/* Pie Chart Container */}
                            <div className="flex-1 h-100 p-3 bg-background border border-zinc-800 rounded-xl">
                                <AssetPieChart />
                            </div>
                        </div>
                    </section>

                    {/* Tables */}
                    <section className="min-h-150 border border-zinc-800 rounded-xl bg-background overflow-hidden p-1">
                        {assetBalancesQuery.isLoading ? (
                            <Skeleton className="w-full h-full" />
                        ) : (
                            <>
                                <div className="w-full mb-2 flex items-center justify-start p-3">
                                    {tableTabs.map((tab) => (
                                        <Button
                                            key={tab}
                                            type="button"
                                            className={`bg-transparent hover:bg-transparent rounded-none border-b-2 hover:text-white cursor-pointer ${tableTab == tab ? 'border-b-white text-white' : 'border-b-transparent text-neutral-900'}`}
                                            onClick={() => {
                                                setTableTab(tab)
                                            }}
                                        >
                                            {tab.charAt(0).toUpperCase() +
                                                tab.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                                <div className="w-full p-3">
                                    <AssetBalanceTable
                                        balances={assetBalances}
                                    />
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>

            <div
                className={`fixed w-10 h-10 bottom-12 right-10 flex items-center justify-center rounded-full bg-gray-900 cursor-pointer transition-all duration-300 ${showScrollToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-100'}`}
                onClick={() => window.scrollTo({ top: 0 })}
            >
                <ChevronUp className="size-5" />
            </div>
        </>
    )
}

export default UserOverviewPage
