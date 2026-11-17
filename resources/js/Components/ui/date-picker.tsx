import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
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
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close when clicking outside or pressing Escape
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isOpen])

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange("")
  }

  const displayDate = formatDisplayDate(value)

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      {/* Hidden input for HTML form support */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      <div className="relative flex items-center w-full">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 font-normal shadow-xs transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer",
            size === "sm" ? "h-8 text-xs" : "h-9 text-xs sm:text-sm",
            !value && "text-muted-foreground",
            value && "text-foreground font-medium",
            clearable && value && !disabled ? "pr-8" : "pr-3"
          )}
        >
          <div className="flex items-center space-x-2 truncate">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayDate || placeholder}</span>
          </div>
        </button>

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Hapus tanggal"
            className="absolute right-2 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Floating Calendar Dropdown (Rendered directly in DOM without external portal) */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 focus:outline-none",
            align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
          )}
        >
          <Calendar
            selected={value}
            onSelect={handleSelectDate}
            minDate={min}
            maxDate={max}
            onClear={clearable && value ? () => handleSelectDate("") : undefined}
          />
        </div>
      )}
    </div>
  )
}
