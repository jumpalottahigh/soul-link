interface Props {
  startDate: string
  endDate: string
}

export function PlannerHeader({ startDate, endDate }: Props) {
  const dateFormat = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 px-1'>
      <div className='min-w-0 space-y-1'>
        <p className='flex flex-wrap gap-x-1 text-sm font-medium text-text'>
          <time dateTime={startDate}>
            {dateFormat.format(new Date(`${startDate}T00:00:00`))}
          </time>
          <span>to</span>
          <time dateTime={endDate}>
            {dateFormat.format(new Date(`${endDate}T00:00:00`))}
          </time>
        </p>
        <p className='text-xs text-text-soft'>07:00 – 23:00</p>
      </div>
    </div>
  )
}
