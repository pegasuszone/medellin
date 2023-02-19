import { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

type ActionType = 'primary' | 'secondary'

interface Action {
  type: ActionType
  name: string
  action: (val?: any) => void
}

const ButtonClassNames =
  'inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:primary focus:ring-offset-2 ring-offset-firefly sm:text-sm sm:w-auto sm:text-sm'

const ButtonTypeClassNames = {
  primary: 'border-transparent bg-primary hover:bg-primary-500 sm:ml-3',
  secondary:
    'mt-3 border-white bg-firefly hover:bg-firefly-600 hover:border-firefly-600 sm:mt-0',
}

const ActionButton = ({
  type,
  name,
  action,
  handleCloseModal,
}: {
  type: Action['type']
  name: Action['name']
  action: Action['action']
  handleCloseModal: () => void
}) => {
  return (
    <button
      type="button"
      className={ButtonClassNames + ' ' + ButtonTypeClassNames[type]}
      onClick={() => {
        handleCloseModal()
        action()
      }}
    >
      {name}
    </button>
  )
}

export function Modal({
  children,
  actions,
  open,
  handleStateChange,
}: {
  children: ReactNode
  actions: Action[]
  open: boolean
  handleStateChange: (val: boolean) => void
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={handleStateChange}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 transition-opacity bg-gray-800 bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-end justify-center min-h-full p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative px-4 pt-5 pb-4 overflow-hidden text-left transition-all transform border rounded-lg shadow-xl bg-bg border-white/10 sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="text-white rounded-md bg-firefly hover:text-white/75 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ring-offset-bg"
                    onClick={() => handleStateChange(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                  </button>
                </div>
                <div>{children}</div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  {actions.map((action) => (
                    <ActionButton
                      {...action}
                      handleCloseModal={() => handleStateChange(false)}
                    />
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
