export interface EngineEventBase {
    id: string
    version: number
    type: string
    details?: Record<string, any> | null
    timestamp: number
}
