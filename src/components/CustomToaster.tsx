import type { FC } from 'react'
import { Toaster, type ToasterProps } from 'sonner'

const CustomToaster: FC<ToasterProps> = (props) => {
    return <Toaster {...props} />
}

export { CustomToaster }
