import { Checkbox } from '@radix-ui/react-checkbox'
import type { FC } from 'react'
import { Input } from './ui/input'

const FormFieldWithToggle: FC<{
    label: string
    name: string
    value: number | null
    checked: boolean
    onToggle: (checked: boolean) => void
}> = (props) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <label className="text-sm">{props.label}</label>
            <Checkbox
                checked={props.checked}
                onCheckedChange={props.onToggle}
            />
        </div>
        <Input
            type="number"
            name={props.name}
            defaultValue={props.value ?? ''}
            step={0.01}
            disabled={!props.checked}
        />
    </div>
)

export default FormFieldWithToggle
