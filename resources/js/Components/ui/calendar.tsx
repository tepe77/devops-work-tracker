import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  selected?: string // YYYY-MM-DD
  onSelect?: (date: string) => void
  minDate?: string // YYYY-MM-DD
  maxDate?: string // YYYY-MM-DD
  className?: string
  showQuickActions?: boolean
  onClear?: () => void
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function formatDateToYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseYMD(str: string): Date | null {
  if (!str) return null
  const parts = str.split("-")
  if (parts.length !== 3) return null
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  return new Date(y, m, d)
}

export function Calendar({
  selected,
  onSelect,
  minDate,
  maxDate,
  className,
  showQuickActions = true,
  onClear,
}: CalendarProps) {
  const initialDate = selected ? parseYMD(selected) || new Date() : new Date()

  const [viewDate, setViewDate] = React.useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  )

  // Sync viewDate if selected changes externally
  React.useEffect(() => {
    if (selected) {
      const parsed = parseYMD(selected)
      if (parsed) {
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
      }
    }
  }, [selected])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const prevYear = () => {
    setViewDate(new Date(year - 1, month, 1))
  }

  const nextYear = () => {
    setViewDate(new Date(year + 1, month, 1))
  }

  const todayYMD = formatDateToYMD(new Date())

  // Generate calendar days (including leading & trailing days)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarDays: Array<{
    dateStr: string
    dayNum: number
    isCurrentMonth: boolean
    isDisabled: boolean
  }> = []

  // Leading days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const dateObj = new Date(year, month - 1, d)
    const dateStr = formatDateToYMD(dateObj)
    const isDisabled =
      (minDate ? dateStr < minDate : false) ||
      (maxDate ? dateStr > maxDate : false)
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isDisabled,
    })
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d)
    const dateStr = formatDateToYMD(dateObj)
    const isDisabled =
      (minDate ? dateStr < minDate : false) ||
      (maxDate ? dateStr > maxDate : false)
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isDisabled,
    })
  }

  // Trailing days for next month to complete rows (up to 42 cells or full 7-col weeks)
  const totalDays = calendarDays.length
  const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
  for (let d = 1; d <= remainingDays; d++) {
    const dateObj = new Date(year, month + 1, d)
    const dateStr = formatDateToYMD(dateObj)
    const isDisabled =
      (minDate ? dateStr < minDate : false) ||
      (maxDate ? dateStr > maxDate : false)
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isDisabled,
    })
  }

  const handleSelect = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled) return
    onSelect?.(dateStr)
  }

  const handleSelectToday = () => {
    const isDisabled =
      (minDate ? todayYMD < minDate : false) ||
      (maxDate ? todayYMD > maxDate : false)
    if (!isDisabled) {
      setViewDate(new Date())
      onSelect?.(todayYMD)
    }
  }

  return (
    <div className={cn("p-1 select-none w-[272px]", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={prevYear}
            title="Tahun Lalu"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={prevMonth}
            title="Bulan Lalu"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-xs font-semibold text-foreground text-center">
          {MONTH_NAMES[month]} {year}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={nextMonth}
            title="Bulan Berikutnya"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextYear}
            title="Tahun Depan"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {DAY_NAMES.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "text-[10px] font-medium py-1",
              idx === 0 ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell) => {
          const isSelected = selected === cell.dateStr
          const isToday = todayYMD === cell.dateStr

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={cell.isDisabled}
              onClick={() => handleSelect(cell.dateStr, cell.isDisabled)}
              className={cn(
                "h-7 w-7 mx-auto rounded-md text-xs font-normal flex items-center justify-center transition-colors relative",
                !cell.isCurrentMonth && "text-muted-foreground/40",
                cell.isCurrentMonth && !isSelected && "text-foreground hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90",
                isToday && !isSelected && "border border-primary/50 font-semibold text-primary",
                cell.isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {cell.dayNum}
            </button>
          )
        })}
      </div>

      {/* Quick Action Footer */}
      {showQuickActions && (
        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/60 text-xs">
          <button
            type="button"
            onClick={handleSelectToday}
            className="text-[11px] font-medium text-primary hover:underline transition-colors"
          >
            Hari Ini
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}
