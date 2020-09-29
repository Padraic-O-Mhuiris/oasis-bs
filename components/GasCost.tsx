import { GasEstimationStatus, HasGasEstimation } from 'helpers/form'
import { formatPrice } from 'helpers/formatters/format'
import React from 'react'
import { Text } from 'theme-ui'

export function GasCost({ gasEstimationEth, gasEstimationStatus }: HasGasEstimation) {
  switch (gasEstimationStatus) {
    case GasEstimationStatus.calculating:
      return <Text variant="processing">...</Text>
    case GasEstimationStatus.error:
      return <Text variant="error">error</Text>
    case GasEstimationStatus.unknown:
      return <Text variant="smallAlt">--</Text>
    case GasEstimationStatus.unset:
    case undefined:
    case GasEstimationStatus.calculated:
      return (
        <Text variant="smallAlt">
          {gasEstimationEth ? `~ ${formatPrice(gasEstimationEth, 'ETH')} ETH` : '--'}
        </Text>
      )
  }
}
