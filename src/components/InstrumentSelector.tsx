import { useGetMarketSymbolsQuery } from '@/hooks/market-hooks'
import { Search } from 'lucide-react'
import { type FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Input } from './ui/input'

interface InstrumentSelectorProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (instrumentId: string) => void
    triggerRef: React.RefObject<HTMLElement>
}

const InstrumentSelector: FC<InstrumentSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    triggerRef,
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const popoverRef = useRef<HTMLDivElement>(null)

    // Use the market symbols query hook
    const symbolsQuery = useGetMarketSymbolsQuery()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            if (!popoverRef.current?.contains(target)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose, triggerRef])

    const symbols = symbolsQuery.data?.status === 200 ? symbolsQuery.data.data : []

    const filteredSymbols = symbols.filter((symbol) =>
        symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelect = (symbol: string) => {
        onSelect(symbol)
        onClose()
    }

    if (!isOpen) {
        return null
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect()
    const style = triggerRect
        ? {
              top: `${triggerRect.bottom + 8}px`,
              left: `${triggerRect.left}px`,
          }
        : {}

    return createPortal(
        <div
            ref={popoverRef}
            style={style}
            className="absolute z-50 w-[450px] h-[500px] bg-background border border-neutral-800 rounded-md shadow-lg flex flex-col p-4"
        >
            <div className="w-full flex justify-between mb-1">
                <h3 className="text-lg font-semibold mb-3">Select Market</h3>
                <Link
                    to="/instrument/"
                    className="h-fit p-1 rounded-sm font-semibold bg-background text-white hover:bg-neutral-800 cursor-pointer"
                >
                    Create Coin
                </Link>
            </div>
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search symbol"
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-neutral-800">
                <span>Symbol</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {symbolsQuery.isLoading ? (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                        Loading...
                    </div>
                ) : filteredSymbols.length > 0 ? (
                    filteredSymbols.map((symbol) => (
                        <div
                            key={symbol}
                            onClick={() => handleSelect(symbol)}
                            className="grid grid-cols-1 gap-4 px-3 py-3 text-sm hover:bg-neutral-800 cursor-pointer rounded-md"
                        >
                            <span className="font-semibold">{symbol}</span>
                        </div>
                    ))
                ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                        No symbols found
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}

export default InstrumentSelector
