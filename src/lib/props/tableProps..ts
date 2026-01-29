import type { OrderRead } from '@/openapi'

export interface TableProps {
    onScrollEnd: () => void
}

export interface OrderTableProps extends TableProps {
    orders: OrderRead[]
}
