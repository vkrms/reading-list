import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface TagComboboxProps {
    value: string
    onChange: (value: string) => void
    suggestions: string[]
}

export function TagCombobox({ value, onChange, suggestions }: TagComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value ?? '')

    // Keep internal input in sync when parent resets (e.g. after form submit)
    React.useEffect(() => {
        setInputValue(value ?? '')
    }, [value])

    const trimmed = inputValue.trim()
    const isNewTag = trimmed.length > 0 && !suggestions.includes(trimmed)

    const handleSelect = (selected: string) => {
        onChange(selected)
        setInputValue(selected)
        setOpen(false)
    }

    const handleInputChange = (val: string) => {
        setInputValue(val)
        onChange(val)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-11 w-full justify-between font-normal',
                        !value && 'text-muted-foreground'
                    )}
                >
                    {value || 'Select or type a tag…'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or create tag…"
                        value={inputValue}
                        onValueChange={handleInputChange}
                    />
                    <CommandList>
                        {suggestions.length === 0 && !trimmed && (
                            <CommandEmpty>Type to create your first tag.</CommandEmpty>
                        )}

                        {suggestions.length > 0 && (
                            <CommandGroup heading="Existing tags">
                                {suggestions.map((tag) => (
                                    <CommandItem
                                        key={tag}
                                        value={tag}
                                        onSelect={handleSelect}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === tag ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {tag}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {isNewTag && (
                            <>
                                {suggestions.length > 0 && <CommandSeparator />}
                                <CommandGroup heading="Create new">
                                    <CommandItem value={trimmed} onSelect={handleSelect}>
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === trimmed ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {trimmed}
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}

                        {!isNewTag && trimmed.length > 0 && suggestions.length > 0 &&
                            !suggestions.includes(trimmed) && (
                                <CommandEmpty>No matching tag.</CommandEmpty>
                            )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
