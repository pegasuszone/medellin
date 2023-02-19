import { InboxIcon } from '@heroicons/react/24/outline'
import { classNames } from 'util/css'

export default function Empty({ small }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-center p-4 space-y-4 text-center">
      <InboxIcon
        className={classNames(
          small ? 'w-12 h-12' : 'w-16 h-15',
          'text-white/50',
        )}
      />
      <p className="text-sm font-medium text-white/75">
        There appears to be nothing here...
      </p>
    </div>
  )
}
