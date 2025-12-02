'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface DropdownItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({ 
  trigger, 
  items, 
  align = 'right', 
  className 
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg py-1',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-accent transition-colors',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  item.variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}