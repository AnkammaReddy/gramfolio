export function PageHeader({
  title,
  description,
  children,
  actions,
}: {
  title?: string
  description?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  const trailing = actions ?? children
  // Sticky banner title is text-base semibold. Description-only pages use h2 one step smaller.
  const descriptionOnly = !title && !!description

  return (
    <div className="mb-2 flex flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && (
          <h2 className="text-base font-semibold tracking-tight text-balance sm:text-lg">{title}</h2>
        )}
        {description &&
          (descriptionOnly ? (
            <h2 className="truncate text-sm font-semibold tracking-tight text-balance text-foreground">
              {description}
            </h2>
          ) : (
            <p className="truncate text-xs font-normal text-muted-foreground sm:text-sm">{description}</p>
          ))}
      </div>
      {trailing && <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>}
    </div>
  )
}
