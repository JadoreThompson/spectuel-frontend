import { HTTP_BASE_URL } from '@/config'
import type { InstrumentSummary } from '@/lib/types/apiTypes/instrumentSummary'
import { Wifi } from 'lucide-react'
import { useEffect, useRef, useState, type FC } from 'react'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

const StatusBar: FC<{
    connectionStatus: ConnectionStatus
}> = ({ connectionStatus }) => {
    const stylesRef = useRef<CSSStyleDeclaration>(
        getComputedStyle(document.documentElement)
    )

    const [instrumentSummaries, setInstrumentSummaries] = useState<
        InstrumentSummary[]
    >([
        { instrument: 'NOVA-USD', change_24h: 2.34, price: 68542.5 },
        { instrument: 'PULSE-USD', change_24h: 4.12, price: 3847.25 },
        { instrument: 'ORBIT-USD', change_24h: -1.87, price: 142.63 },
        { instrument: 'SPARK-USD', change_24h: 8.45, price: 0.6523 },
        { instrument: 'FLUX-USD', change_24h: -3.21, price: 0.1842 },
        { instrument: 'ZENITH-USD', change_24h: 1.56, price: 2.47 },
        { instrument: 'PRISM-USD', change_24h: -0.89, price: 0.6821 },
        { instrument: 'VORTEX-USD', change_24h: 5.67, price: 38.94 },
        { instrument: 'NEXUS-USD', change_24h: 3.28, price: 18.52 },
        { instrument: 'ECHO-USD', change_24h: -2.14, price: 0.8934 },
    ])

    useEffect(() => {
        const fetchInstSummaries = async () => {
            const rsp = await fetch(HTTP_BASE_URL + '/instrument/summary', {
                credentials: 'include',
            })
            if (rsp.ok) {
                const data: InstrumentSummary[] = await rsp.json()
                setInstrumentSummaries(data)
            }
        }

        fetchInstSummaries()
    }, [])

    const connectionColor =
        connectionStatus === 'connected'
            ? stylesRef.current.getPropertyValue('--green')
            : connectionStatus === 'connecting'
              ? 'orange'
              : stylesRef.current.getPropertyValue('--red')

    const connectionMsg =
        connectionStatus === 'connected'
            ? 'Connected'
            : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'

    return (
        <div className="w-full h-full flex items-center relative border-t-1 border-t-gray bg-background text-xs">
            <div className="w-fit h-full absolute top-0 left-0 z-2 flex items-center gap-2 px-2 border-r-1 border-r-gray bg-[var(--background)]">
                <Wifi className="size-3" color={connectionColor} />
                <span style={{ color: connectionColor }}>{connectionMsg}</span>
            </div>
            <div className="w-full h-full flex flex-row">
                <div className="w-fit flex">
                    {instrumentSummaries.map((st) => (
                        <div className="w-50 h-full flex items-center justify-center gap-1 marquee-item">
                            <span className="whitespace-nowrap">
                                {st.instrument}
                            </span>
                            <span
                                className={`${typeof st.change_24h === 'number' ? (st.change_24h < 0 ? 'text-#c93639' : 'text-green-500') : ''}`}
                            >
                                {st.change_24h}%
                            </span>
                            <span className="text-gray-300">{st.price}</span>
                        </div>
                    ))}

                    {instrumentSummaries.map((st) => (
                        <div className="w-50 h-full flex items-center justify-center gap-1 marquee-item">
                            <span className="whitespace-nowrap">
                                {st.instrument}
                            </span>
                            <span
                                className={`${typeof st.change_24h === 'number' ? (st.change_24h < 0 ? 'text-#c93639' : 'text-green-500') : ''}`}
                            >
                                {st.change_24h}%
                            </span>
                            <span className="text-gray-300">{st.price}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default StatusBar
