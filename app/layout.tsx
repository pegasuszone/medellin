'use client'

import WalletProvider from 'client/react/wallet/WalletProvider'
import { TxProvider } from 'contexts/tx'
import Head from 'next/head'
import { ErrorInfo, SVGProps, useCallback, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { MetaTags, Social, ISocial } from 'components'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChakraProvider } from '@chakra-ui/react'
import { classNames } from 'util/css'
import Tooltip from 'components/Tooltip'
import { useWallet } from 'client'
import { useChain } from '@cosmos-kit/react'
import { defaultTheme } from '@cosmos-kit/react'

import {
  CogIcon,
  HomeIcon,
  InboxArrowDownIcon,
  LinkIcon,
  WalletIcon,
} from '@heroicons/react/24/solid'

import 'animate.css'
import 'styles/globals.css'
import { ShortUrl } from '@prisma/client'
import useToaster, { ToastTypes } from 'hooks/useToaster'
import copy from 'copy-to-clipboard'

interface INavigation {
  name: string
  href: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  current: boolean
  notification?: boolean
}

const socials: ISocial[] = [
  {
    name: 'GitHub',
    href: 'https://github.com/pegasuszone',
    icon: '/socials/github.svg',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com/zonepegasus',
    icon: '/socials/twitter.svg',
  },
]

function NavigationItem(props: INavigation) {
  const { name, href, current, notification } = props

  return (
    <Tooltip text={name}>
      <Link
        href={href}
        rel={href.includes('https') ? 'noopener noreferrer' : ''}
        target={href.includes('https') ? '_blank' : ''}
      >
        <div className="cursor-pointer md:transition md:duration-300 md:ease-in-out rounded-md md:transform md:hover:translate-x-1 md:hover:scale-110 bg-gradient-to-br from-bg-bg to-bg-white/50 md:rounded-full aspect-1 w-full h-full p-[0.0625rem]">
          <div className="flex items-center justify-center w-full h-full rounded-md md:rounded-full bg-bg-light">
            <props.icon
              className={classNames(
                current ? 'text-white' : 'text-white/30',
                'w-8 md:w-5 h-8 md:h-5',
              )}
            />
          </div>
          {notification && (
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full"></div>
          )}
        </div>
      </Link>
    </Tooltip>
  )
}

function Wallet() {
  const { wallet } = useWallet()
  const { connect, openView, isWalletConnected } = useChain(
    process.env.NEXT_PUBLIC_NETWORK!,
  )

  return (
    <div className={!isWalletConnected ? 'md:relative md:-top-2' : ''}>
      <Tooltip text={wallet ? 'Wallet' : 'Connect Wallet'}>
        <div
          onClick={() => {
            if (!wallet) connect()
            else openView()
          }}
          className="cursor-pointer md:transition md:duration-300 md:ease-in-out rounded-md md:transform md:hover:translate-x-1 md:hover:scale-110 bg-gradient-to-br from-bg-bg to-bg-white/50 md:rounded-full aspect-1 w-full h-full p-[0.0625rem]"
        >
          <div className="flex items-center justify-center w-full h-full rounded-md md:rounded-full bg-bg-light">
            <WalletIcon
              className={classNames(
                wallet ? 'text-bg-white' : 'text-white/30',
                'w-8 md:w-5 h-8 md:h-5',
              )}
            />
          </div>
        </div>
      </Tooltip>
    </div>
  )
}

function TradeURL() {
  const [copied, setCopied] = useState<boolean>(false)
  const [tradeURL, setTradeURL] = useState<string>()

  const toaster = useToaster()
  const { address, isWalletConnected } = useChain(
    process.env.NEXT_PUBLIC_NETWORK!,
  )

  useEffect(() => {
    async function effect() {
      if (isWalletConnected && address) {
        const tradePath =
          '?' +
          new URLSearchParams({
            peer: address,
          }).toString()

        // this should include the pz-l.ink/[short_url] , which will redirect to pegasus-trade.zone/link/
        const shortUrl: ShortUrl = await fetch('/api/shorturl', {
          method: 'POST',
          body: JSON.stringify({
            destination: tradePath,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((res) => {
            return res.json()
          })
          .catch((e) => {
            console.error(e)
          })

        setTradeURL(shortUrl.tiny_url)
      }
    }
    effect()
  }, [isWalletConnected, address, setTradeURL])

  const copyTradeUrl = useCallback(async () => {
    if (isWalletConnected && address && tradeURL) {
      copy(`${process.env.NEXT_PUBLIC_SHORT_URL!}/${tradeURL}`)

      toaster.toast({
        title: 'Trade URL copied!',
        type: ToastTypes.Success,
        dismissable: true,
      })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [isWalletConnected, address, tradeURL, setCopied])

  return isWalletConnected ? (
    <Tooltip text={copied ? 'Copied!' : 'Copy Trade URL'}>
      <div
        onClick={copyTradeUrl}
        className="cursor-pointer md:transition md:duration-300 md:ease-in-out rounded-md md:transform md:hover:translate-x-1 md:hover:scale-110 bg-gradient-to-br from-bg-bg to-bg-white/50 md:rounded-full aspect-1 w-full h-full p-[0.0625rem]"
      >
        <div className="flex items-center justify-center w-full h-full rounded-md md:rounded-full bg-bg-light">
          <LinkIcon
            className={classNames(
              copied ? 'text-white' : 'text-white/30',
              'w-8 md:w-5 h-8 md:h-5',
            )}
          />
        </div>
      </div>
    </Tooltip>
  ) : (
    <></>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const path = usePathname()

  const navigation: INavigation[] = [
    {
      name: 'Trade',
      href: '/trade',
      icon: HomeIcon,
      current: path!.split('/').includes('trade'),
    },
    {
      name: 'Inbox',
      href: '/inbox',
      icon: InboxArrowDownIcon,
      current: path!.split('/').includes('inbox'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      current: path!.split('/').includes('settings'),
    },
  ]

  return (
    <html>
      <Head>
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1, user-scalable=no"
        />
      </Head>
      <body>
        <Toaster position="top-right" />
        <ChakraProvider theme={defaultTheme}>
          <WalletProvider>
            <TxProvider>
              <MetaTags
                title="Pegasus"
                description="P2P trading platform for Stargaze NFTs"
                image="https://user-images.githubusercontent.com/25516960/186937317-b16cc010-fa80-4a5e-a3bb-45e2413242df.png"
                ogImage="https://user-images.githubusercontent.com/25516960/186937317-b16cc010-fa80-4a5e-a3bb-45e2413242df.png"
                url="https://www.pegasus-trade.zone"
              />
              <main className="w-screen min-h-screen overflow-x-hidden text-white bg-bg">
                <div>
                  <nav className="fixed z-20 w-screen -bottom-1 md:flex md:items-center md:inset-y-0 md:w-48">
                    <div className="p-0.5 md:rounded-full bg-gradient-to-r from-white/10 via-white/15 to-white/30 md:w-[4.5rem] md:ml-8">
                      <div className="flex flex-row w-screen p-2.5 space-x-2 md:w-full md:h-auto bg-bg md:shadow-lg md:rounded-full md:flex-col md:space-y-2 md:space-x-0">
                        {navigation.map((item, key) => (
                          <NavigationItem key={key} {...item} />
                        ))}
                        <div className="justify-center hidden md:flex">
                          <div className="bg-gradient-to-r from-bg-white/10 to-bg-white/20 w-7 my-1.5 h-[1px]"></div>
                        </div>
                        <div className="hidden md:block md:space-y-2">
                          {socials.map((item, key) => (
                            <NavigationItem
                              key={key}
                              name={item.name}
                              href={item.href}
                              current={false}
                              icon={() => (
                                <img
                                  src={item.icon}
                                  className="w-5 h-5 opacity-[0.3]"
                                />
                              )}
                            />
                          ))}
                        </div>
                        <div className="justify-center hidden md:flex">
                          <div className="bg-gradient-to-r from-bg-white/10 to-bg-white/20 w-7 my-1.5 h-[1px]"></div>
                        </div>
                        <div className="w-full">
                          <TradeURL />
                        </div>
                        <div className="relative w-full">
                          <Wallet />
                        </div>
                      </div>
                    </div>
                  </nav>
                  <div className="md:pl-48">
                    <div className="min-h-[75vh] mb-[15vh] md:mb-auto">
                      {children}
                    </div>
                    <footer className="flex-col items-center hidden my-8 md:flex">
                      <div>
                        <img src="/logo_new_text.png" className="w-auto h-12" />
                        <div className="flex flex-row justify-center mt-5 space-x-6">
                          {socials.map((social, key) => (
                            <Social {...social} key={key} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-8 text-xs font-medium text-center text-white/50">
                        &copy; Maurits Bos & Josef Leventon 2022-23
                      </p>
                    </footer>
                  </div>
                </div>
              </main>
            </TxProvider>
          </WalletProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}

RootLayout.componentDidCatch = (error: Error, errorInfo: ErrorInfo) => {
  console.error(error, errorInfo)
}
