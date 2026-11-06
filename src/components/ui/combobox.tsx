"use client";

import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "default" | "sm" | "lg";
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * Combobox de Alta Gama (Estándar Quisqueya Private Desk).
 *
 * Características:
 * - Desplegable accesible mediante Radix Popover con búsqueda en tiempo real.
 * - Soporte para grupos de opciones, iconos, insignias y descripciones.
 * - Navegación táctil ergonómica (≥44px en móvil / 40px en escritorio).
 * - Navegación por teclado accesible: Flechas, Enter, Escape.
 * - Botón de limpieza rápida opcional.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar en catálogo...",
  emptyText = "Sin coincidencias encontradas.",
  disabled = false,
  clearable = false,
  className,
  triggerClassName,
  contentClassName,
  size = "default",
  id,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ComboboxProps) {
  const generatedId = useId();
  const comboboxId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Opción activa
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filtrado de opciones
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchDesc = opt.description?.toLowerCase().includes(query) ?? false;
      const matchGroup = opt.group?.toLowerCase().includes(query) ?? false;
      const matchValue = opt.value.toLowerCase().includes(query);
      return matchLabel || matchDesc || matchGroup || matchValue;
    });
  }, [options, search]);

  // Agrupamiento de opciones
  const groups = useMemo(() => {
    const map = new Map<string, ComboboxOption[]>();
    for (const opt of filteredOptions) {
      const grp = opt.group ?? "";
      if (!map.has(grp)) map.set(grp, []);
      map.get(grp)!.push(opt);
    }
    return Array.from(map.entries());
  }, [filteredOptions]);

  // Mantener visible la opción activa sin desplazar el fondo de la página.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-option-index="${focusedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) { setSearch(""); setFocusedIndex(-1); }
  }

  // Teclado
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        changeOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const enabled = filteredOptions.map((opt, index) => opt.disabled ? -1 : index).filter(index => index >= 0);
      if (!enabled.length) return;
      const current = enabled.indexOf(focusedIndex);
      const next = e.key === "Home" ? 0 : e.key === "End" ? enabled.length - 1 : e.key === "ArrowDown" ? (current + 1) % enabled.length : current <= 0 ? enabled.length - 1 : current - 1;
      setFocusedIndex(enabled[next]!);
      return;
    }
    if (e.key === "Enter") e.preventDefault();

    if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
      e.preventDefault();
      const target = filteredOptions[focusedIndex];
      if (target && !target.disabled) {
        onChange(target.value);
        setOpen(false);
      }
      return;
    }
  }

  const SelectedIcon = selectedOption?.icon;

  const sizeClasses = {
    sm: "min-h-[44px] h-11 px-2.5 text-xs rounded-md",
    default: "min-h-[44px] h-11 px-3.5 text-sm rounded-lg",
    lg: "min-h-[48px] h-12 px-4 text-base rounded-xl",
  }[size];

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={changeOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={comboboxId}
            disabled={disabled}
            aria-expanded={open}
            aria-controls={open ? `${comboboxId}-list` : undefined}
            aria-haspopup="listbox"
            aria-label={ariaLabel ?? placeholder}
            aria-labelledby={ariaLabelledBy}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex w-full items-center justify-between gap-2 border border-border bg-surface text-ink transition-all cursor-pointer outline-none select-none",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-alt",
              "hover:border-gold-600/50 hover:bg-surface-hover",
              sizeClasses,
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              {SelectedIcon && (
                <SelectedIcon className="size-4 shrink-0 text-gold-700" />
              )}
              {selectedOption ? (
                <span className="truncate font-medium text-ink">
                  {selectedOption.label}
                </span>
              ) : (
                <span className="truncate text-muted-foreground">
                  {placeholder}
                </span>
              )}
              {selectedOption?.badge && (
                <span className="shrink-0 px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-gold-100 text-gold-800 border border-gold-300">
                  {selectedOption.badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-150",
                  open && "rotate-180 text-gold-700"
                )}
              />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          onOpenAutoFocus={event => { event.preventDefault(); searchInputRef.current?.focus(); }}
          align="start"
          sideOffset={6}
          className={cn(
            "w-[var(--radix-popover-trigger-width)] min-w-0 max-w-[calc(100vw-24px)] p-0 bg-surface border border-border shadow-xl rounded-xl overflow-hidden z-50",
            contentClassName
          )}
        >
          {/* Campo de búsqueda */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-alt">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${comboboxId}-list`}
              aria-activedescendant={focusedIndex >= 0 ? `${comboboxId}-option-${focusedIndex}` : undefined}
              aria-autocomplete="list"
              aria-label={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted-foreground focus:outline-none min-h-[32px]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-ink rounded transition-colors"
                aria-label="Borrar búsqueda"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Lista de opciones */}
          <div
            ref={listRef}
            id={`${comboboxId}-list`}
            aria-label={ariaLabel ?? placeholder}
            role="listbox"
            tabIndex={-1}
            className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-110px))] overflow-y-auto overscroll-contain p-1.5 space-y-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-muted-foreground">
                <p className="m-0 font-medium">{emptyText}</p>
              </div>
            ) : (
              groups.map(([groupName, groupOptions]) => (
                <div key={groupName || "default-group"} className="space-y-0.5">
                  {groupName && (
                    <div className="px-2.5 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {groupName}
                    </div>
                  )}

                  {groupOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    const optionIndex = filteredOptions.indexOf(opt);
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        id={`${comboboxId}-option-${optionIndex}`}
                        data-option-index={optionIndex}
                        tabIndex={-1}
                        onMouseEnter={() => !opt.disabled && setFocusedIndex(optionIndex)}
                        aria-selected={isSelected}
                        disabled={opt.disabled}
                        onClick={() => {
                          if (!opt.disabled) {
                            onChange(opt.value);
                            setOpen(false);
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer outline-none min-h-[44px]",
                          focusedIndex === optionIndex && "ring-2 ring-inset ring-gold-700 bg-surface-alt",
                          isSelected
                            ? "bg-gold-100 text-gold-950 font-semibold"
                            : "text-ink hover:bg-surface-hover hover:text-navy-950",
                          opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          {OptIcon && (
                            <OptIcon
                              className={cn(
                                "size-4 shrink-0",
                                isSelected ? "text-gold-700" : "text-muted-foreground"
                              )}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="truncate">{opt.label}</div>
                            {opt.description && (
                              <div className="text-xs text-muted-foreground truncate font-normal">
                                {opt.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {opt.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-surface-alt border border-line text-muted-foreground">
                              {opt.badge}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="size-4 text-gold-700 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Pie de listbox informativo */}
          <div className="px-3 py-1.5 border-t border-border bg-surface-alt/70 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{filteredOptions.length} opciones disponibles</span>
            <span className="hidden sm:inline">Usa flechas para navegar</span>
          </div>
        </PopoverContent>
      </Popover>

      {clearable && selectedOption && !disabled && <button type="button" className="mt-1 min-h-11 text-sm text-muted-foreground" onClick={() => onChange("")} aria-label="Limpiar selección">Limpiar selección</button>}

      {/* Input hidden para compatibilidad de formularios nativos */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}
    </div>
  );
}
