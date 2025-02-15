import { isAppContextAvailable, useAppContext } from 'components/AppContextProvider'
import { useObservable } from 'helpers/observableHook'
import { WithChildren } from 'helpers/types'
import { LinkProps } from 'next/dist/client/link'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { Link as ThemeLink, SxStyleProp } from 'theme-ui'

export interface AppLinkProps extends WithChildren, LinkProps {
  disabled?: boolean
  href: string
  sx?: SxStyleProp
  variant?: string
  internalInNewTab?: boolean
  withAccountPrefix?: boolean
}

export function AppLink({
  href,
  children,
  disabled,
  sx,
  variant = 'styles.a',
  ...rest
}: AppLinkProps) {
  const isInternalLink = href && (href.startsWith('/') || href.startsWith('#'))

  if (disabled) return children

  if (isInternalLink) {
    return (
      <InternalLink
        {...{ href, sx, variant, isAppContextAvailable: isAppContextAvailable(), ...rest }}
      >
        {children}
      </InternalLink>
    )
  }

  return <ThemeLink {...{ sx, href, variant, target: '_blank' }}>{children}</ThemeLink>
}

function InternalLink({
  href,
  sx,
  children,
  internalInNewTab,
  as,
  isAppContextAvailable,
  withAccountPrefix = true,
  variant,
  ...rest
}: AppLinkProps & { isAppContextAvailable: boolean }) {
  const {
    query: { network },
  } = useRouter()
  let readOnlyHref = href
  let readOnlyAs = as

  const actualHref =
    isAppContextAvailable && network
      ? { pathname: readOnlyHref as string, query: { network } }
      : readOnlyHref

  const actualAs =
    readOnlyAs && isAppContextAvailable && network
      ? { pathname: readOnlyAs as string, query: { network } }
      : readOnlyAs

  // console.log('href', actualHref)
  // console.log('as', actualAs, as)

  return (
    <Link href={actualHref} as={actualAs} passHref {...rest}>
      <ThemeLink target={internalInNewTab ? '_blank' : '_self'} sx={sx} variant={variant}>
        {children}
      </ThemeLink>
    </Link>
  )
}
