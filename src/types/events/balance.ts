import { OrderStatus, OrderType, Side } from '@/openapi'
import { EngineEventBase } from './base'
import { BalanceEventType } from './enums'

export interface BalanceEventBase extends EngineEventBase {
    user_id: string
    version: number
    command_id: string
}

export interface CashBalanceIncreasedEvent extends BalanceEventBase {
    type: BalanceEventType.CASH_BALANCE_INCREASED
    amount: number
}

export interface CashBalanceDecreasedEvent extends BalanceEventBase {
    type: BalanceEventType.CASH_BALANCE_DECREASED
    amount: number
}

export interface CashEscrowIncreasedEvent extends BalanceEventBase {
    type: BalanceEventType.CASH_ESCROW_INCREASED
    amount: number
}

export interface CashEscrowDecreasedEvent extends BalanceEventBase {
    type: BalanceEventType.CASH_ESCROW_DECREASED
    amount: number
}

export interface AssetBalanceIncreasedEvent extends BalanceEventBase {
    type: BalanceEventType.ASSET_BALANCE_INCREASED
    symbol: string
    amount: number
}

export interface AssetBalanceDecreasedEvent extends BalanceEventBase {
    type: BalanceEventType.ASSET_BALANCE_DECREASED
    symbol: string
    amount: number
}

export interface AssetEscrowIncreasedEvent extends BalanceEventBase {
    type: BalanceEventType.ASSET_ESCROW_INCREASED
    symbol: string
    amount: number
}

export interface AssetEscrowDecreasedEvent extends BalanceEventBase {
    type: BalanceEventType.ASSET_ESCROW_DECREASED
    symbol: string
    amount: number
}

export interface AskSettledEvent extends BalanceEventBase {
    type: BalanceEventType.ASK_SETTLED
    symbol: string
    quantity: number
    price: number
    asset_escrow_decreased: AssetEscrowDecreasedEvent
    asset_balance_decreased: AssetBalanceDecreasedEvent
    cash_balance_increased: CashBalanceIncreasedEvent
    trade_event_id: string
}

export interface BidSettledEvent extends BalanceEventBase {
    type: BalanceEventType.BID_SETTLED
    symbol: string
    quantity: number
    price: number
    cash_escrow_decreased: CashEscrowDecreasedEvent
    cash_balance_decreased: CashBalanceDecreasedEvent
    asset_balance_increased: AssetBalanceIncreasedEvent
    trade_event_id: string
}

export interface AssetBalanceSnapshotOrder {
    order_id: string
    order_type: OrderType
    side: Side
    quantity: number
    executed_quantity: number
    avg_fill_price: number
    status: OrderStatus
    limit_price?: number | null
    stop_price?: number | null
}

export interface AssetBalanceSnapshotEvent extends BalanceEventBase {
    type: BalanceEventType.ASSET_BALANCE_SNAPSHOT
    symbol: string
    available_asset_balance: number
    available_cash_balance: number
}

export type BalanceEvent =
    | CashBalanceIncreasedEvent
    | CashBalanceDecreasedEvent
    | CashEscrowIncreasedEvent
    | CashEscrowDecreasedEvent
    | AssetBalanceIncreasedEvent
    | AssetBalanceDecreasedEvent
    | AssetEscrowIncreasedEvent
    | AssetEscrowDecreasedEvent
    | AskSettledEvent
    | BidSettledEvent
    | AssetBalanceSnapshotEvent
