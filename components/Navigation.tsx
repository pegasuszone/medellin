import type { SVGProps } from "react";
import { Fragment, useState } from "react";
import { Transition, Menu, Dialog } from "@headlessui/react";
import { classNames } from "util/css";
import {
  Bars3Icon as MenuIcon,
  XMarkIcon as XIcon,
} from "@heroicons/react/24/outline";
import Wallet from "./Wallet";
import Link from "next/link";

export interface NavigationItem {
  name: string;
  href: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  current: boolean;
}

export default function Navigation({
  navigation,
}: {
  navigation: NavigationItem[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <div className="min-h-full">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-firefly">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 pt-2 -mr-12">
                    <button
                      type="button"
                      className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XIcon
                        className="w-6 h-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex items-center flex-shrink-0 px-4">
                  <img
                    className="w-auto -ml-3 h-14"
                    src="/logo_text.png"
                    alt="Pegasus logo"
                  />
                </div>
                <nav
                  className="flex-shrink-0 h-full mt-5 overflow-y-auto divide-y divide-white"
                  aria-label="Sidebar"
                >
                  <div className="flex flex-col flex-grow-0 px-2 space-y-1">
                    <Wallet />
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-primary-600 text-white"
                            : "text-white hover:bg-primary-700",
                          "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        <item.icon
                          className="flex-shrink-0 w-6 h-6 mr-4 text-white"
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    ))}
                  </div>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto border-r border-white/10 bg-firefly">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              className="w-auto h-16"
              src="/logo_text.png"
              alt="Pegasus logo"
            />
          </div>
          <Wallet />
          <nav
            className="flex flex-col flex-1 mt-3 overflow-y-auto"
            aria-label="Sidebar"
          >
            <div className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link href={item.href} key={item.name}>
                  <a
                    className={classNames(
                      item.current
                        ? "bg-firefly-600 text-white"
                        : "text-white hover:bg-firefly-700",
                      "group flex items-center px-2 py-2 text-sm leading-6 font-medium rounded-md"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    <item.icon
                      className="flex-shrink-0 w-6 h-6 mr-4 text-white"
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <div className="flex flex-col flex-1 lg:hidden">
        <div className="relative z-10 flex items-center justify-between flex-shrink-0 h-16 border-b border-white/10 bg-firefly lg:border-none">
          <img src="/logo.png" className="w-auto h-10 ml-4"></img>
          <button
            type="button"
            className="h-full px-5 text-white border-l border-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
