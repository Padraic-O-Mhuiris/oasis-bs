import { WithChildren } from 'helpers/types'
import * as React from 'react'
import { Box, Flex, Spinner } from 'theme-ui'
import { MarkRequired } from 'ts-essentials'

import { Loadable } from '../loadable'

interface LoadingIndicatorProps<T, U extends Loadable<T>> {
  loadable?: U
  children: (loadable: MarkRequired<U, 'value'>) => React.ReactElement<any>
  variant?: string
  error?: React.ReactElement<any>
}

interface WithLoadingIndicatorWrapperProps extends WithChildren {
  height?: number
  sx?: any
}

export const WithLoadingIndicatorWrapper = ({ children, sx }: WithLoadingIndicatorWrapperProps) => {
  return (
    <Flex sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', ...sx }}>
      {children}
    </Flex>
  )
}

export function WithLoadingIndicator<T, U extends Loadable<T>>(props: LoadingIndicatorProps<T, U>) {
  const { loadable, children, variant, error } = props

  if (!loadable) {
    return <LoadingIndicator {...{ variant }} />
  }

  switch (loadable.status) {
    case undefined:
    case 'loading':
      return <LoadingIndicator {...{ variant }} />
    case 'error':
      if (error) {
        return error
      }
      return <div>error!</div>
    case 'loaded':
      return children(loadable as MarkRequired<U, 'value'>)
  }
}

export function WithLoadingIndicatorInline<T, U extends Loadable<T>>(
  props: LoadingIndicatorProps<T, U>,
) {
  return WithLoadingIndicator({ ...props })
}

export const LoadingIndicator = ({ variant }: { variant?: string }) => {
  return (
    // fontSize: 0px used to hide empty space created below Spinner SVG
    <Box sx={{ textAlign: 'center', fontSize: '0px' }}>
      <Spinner variant={variant || 'styles.spinner.default'} />
    </Box>
  )
}
