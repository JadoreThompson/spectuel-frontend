export const queryKeys = {
    orders: {
        all: ['orders'] as const,
    },
    auth: {
        all: ['auth'] as const,
        me: () => [...queryKeys.auth.all, 'me'] as const,
    },
}
