// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import BigNumber from 'bignumber.js'
import { formatCryptoBalance } from 'helpers/formatters/format'
import { useTranslation } from 'i18n'
import React from 'react'
import { Box, Card, Flex, Grid, Heading, Text } from 'theme-ui'

interface CardBalanceProps {
  icon: string
  balance: BigNumber
  token?: string
  customText?: string
}

interface CardProductProps {
  icon: JSX.Element
  title: string
  description: string
  bottomComponent: JSX.Element
  onClick?: () => void
}

export function CardBalance({ token, icon, balance, customText }: CardBalanceProps) {
  const { t } = useTranslation('common')

  return (
    <Card variant="secondaryRounded" sx={{ my: 2, px: 4 }}>
      <Grid gap={2}>
        <Text sx={{ fontSize: 4, color: 'textAlt', fontWeight: 'semiBold' }}>
          {token && t('token-balance', { token })}
          {customText}
        </Text>
        <Flex sx={{ alignItems: 'center' }}>
          <Icon name={icon} size={22} />
          <Text sx={{ ml: 1, fontSize: 5 }}>{formatCryptoBalance(balance)}</Text>
        </Flex>
      </Grid>
    </Card>
  )
}

export function CardProduct({
  icon,
  title,
  description,
  bottomComponent,
  onClick,
}: CardProductProps) {
  return (
    <Card variant="primaryWithHover" onClick={onClick}>
      <Flex sx={{ m: 2 }}>
        <Box sx={{ mr: [3, 4], mt: 2 }}>{icon}</Box>
        <Grid sx={{ flex: 1, color: 'primary' }} gap="10px">
          <Heading variant="smallHeading">{title}</Heading>
          <Text>{description}</Text>
          {bottomComponent}
        </Grid>
      </Flex>
    </Card>
  )
}
