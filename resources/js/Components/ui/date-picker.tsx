import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar } from "./calendar"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  min?: string // YYYY-MM-DD
  max?: string // YYYY-MM-DD
  className?: string
  id?: string
  name?: string
  size?: "sm" | "default"
  clearable?: boolean
  align?: "start" | "center" | "end"
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ]
  if (m >= 0 && m < 12 && !isNaN(d) && !isNaN(y)) {
    return `${d} ${shortMonths[m]} ${y}`
  }
  return dateStr
}

export function DatePicker({
  value = "",
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  required = false,
  min,
  max,
  className,
  id,
  name,
  size = "default",
  clearable = true,
  align = "start",
}: DatePickerProps) {
  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onChange("")
  }

  const displayDate = formatDisplayDate(value)

  return (
    <div className={cn("relative inline-block w-full", className)}>
      {/* Hidden input for HTML form support */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <Popover>
        <PopoverTrigger
          id={id}
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 font-normal shadow-xs transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left",
            size === "sm" ? "h-8 text-xs" : "h-9 text-xs sm:text-sm",
            !value && "text-muted-foreground",
            value && "text-foreground font-medium"
          )}
        >
          <div className="flex items-center space-x-2 truncate">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayDate || placeholder}</span>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-1.5">
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear()
                  }
                }}
                title="Hapus tanggal"
                className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent align={align} className="p-2 w-auto shadow-xl">
          {({ close }) => (
            <Calendar
              selected={value}
              onSelect={(dateStr) => {
                onChange(dateStr)
                close()
              }}
              minDate={min}
              maxDate={max}
              onClear={
                clearable && value
                  ? () => {
                      onChange("")
                      close()
                    }
                  : undefined
              }
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
