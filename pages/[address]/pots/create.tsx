// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { useAppContext } from 'components/AppContextProvider'
import { CardProduct } from 'components/Cards'
import { getApyPercentage } from 'components/dashboard/dsrPot/dsrPot'
import { AppLink } from 'components/Links'
import { WithLoadingIndicator } from 'helpers/loadingIndicator/LoadingIndicator'
import { useObservable } from 'helpers/observableHook'
import { useReadonlyAccount } from 'helpers/useReadonlyAccount'
import { useTranslation } from 'i18n'
import React from 'react'
import { Badge, Box, Flex, Grid, Heading, Text } from 'theme-ui'

function DSRApy() {
  const { t } = useTranslation('common')
  const { dashboard$ } = useAppContext()
  const dashboard = useObservable(dashboard$)

  return (
    <Box>
      <Badge variant="primary">
        <Flex sx={{ alignItems: 'center' }}>
          <WithLoadingIndicator variant="styles.spinner.default" loadable={dashboard?.pots.dsr}>
            {({ value: pot }) => {
              const apy = getApyPercentage(pot)
              return <>{+apy.toFixed(2)} </>
            }}
          </WithLoadingIndicator>
          <Text>% {t('apy')}</Text>
        </Flex>
      </Badge>
    </Box>
  )
}

export default function CreatePotPage() {
  const { t } = useTranslation('common')
  useReadonlyAccount(true)

  return (
    <Grid gap={4} sx={{ width: '100%' }}>
      <Heading as="h1" variant="mediumHeading" sx={{ textAlign: 'center' }}>
        {t('select-product')}
      </Heading>
      <AppLink href="/pots/[pot]/create" as="/pots/dsr/create">
        <CardProduct
          {...{
            icon: <Icon name="maker_circle_color" size={45} />,
            title: t('dai-savings-rate'),
            description: t('dsr-product'),
            bottomComponent: <DSRApy />,
          }}
        />
      </AppLink>
    </Grid>
  )
}

CreatePotPage.layoutProps = {
  backLink: {
    href: '/dashboard',
  },
}
