export const queryKeys = {
    auth: {
        all: ['auth'] as const,
        me: () => [...queryKeys.auth.all, 'me'] as const,
        wsToken: () => [...queryKeys.auth.all, 'wsToken'] as const,
    },
    orders: {
        all: ['orders'] as const,
        list: (params?: any) => [...queryKeys.orders.all, params] as const,
        detail: (orderId: string) =>
            [...queryKeys.orders.all, 'detail', orderId] as const,
        group: (groupId: string) =>
            [...queryKeys.orders.all, 'group', groupId] as const,
    },
    user: {
        all: ['user'] as const,
        overview: () => [...queryKeys.user.all, 'overview'] as const,
        events: (params: any) =>
            [...queryKeys.user.all, 'events', params] as const,
        assetBalances: (params?: any) =>
            [...queryKeys.user.all, 'assetBalances', params] as const,
    },
    market: {
        all: ['market'] as const,
        bars: (symbol: string, params: any) =>
            [...queryKeys.market.all, 'bars', symbol, params] as const,
        symbols: () => [...queryKeys.market.all, 'symbols'] as const,
        stats: (symbol: string) =>
            [...queryKeys.market.all, 'stats', symbol] as const,
    },
}
