import React, { useState, useEffect } from "react"
import { Calendar } from "lucide-react"

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string // YYYY-MM-DD
  onValueChange: (val: string) => void
}

export function DateInput({ value, onValueChange, className, ...props }: DateInputProps) {
  // textValue is what the user sees/types: DD/MM/YYYY
  const [textValue, setTextValue] = useState("")

  // Sync incoming value (YYYY-MM-DD) to textValue (DD/MM/YYYY)
  useEffect(() => {
    if (!value) {
      setTextValue("")
      return
    }
    const [y, m, d] = value.split("-")
    if (y && m && d && y.length === 4) {
      const formatted = `${d}/${m}/${y}`
      if (textValue !== formatted) {
        setTextValue(formatted)
      }
    }
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "")
    
    // Auto-format as DD/MM/YYYY
    if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2)
    if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5)
    if (val.length > 10) val = val.slice(0, 10)
    
    setTextValue(val)

    // If fully typed, update the real YYYY-MM-DD value
    if (val.length === 10) {
      const [d, m, y] = val.split("/")
      const parsed = Date.parse(`${y}-${m}-${d}`)
      if (!isNaN(parsed)) {
        onValueChange(`${y}-${m}-${d}`)
      }
    } else if (val.length === 0) {
      onValueChange("")
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="dd/mm/yyyy"
        value={textValue}
        onChange={handleTextChange}
        className={className}
        maxLength={10}
        {...props}
      />
      {/* Hidden native date picker just for the calendar icon click */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer w-6 h-6 flex items-center justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          className="absolute right-0 opacity-0 cursor-pointer h-full w-[200px] pointer-events-auto"
          style={{ clipPath: "inset(0 0 0 calc(200px - 24px))" }}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
