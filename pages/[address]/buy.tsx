// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { CardProduct } from 'components/Cards'
import { OnrampKind } from 'components/dashboard/onramp/onrampForm'
import { OnrampFormView } from 'components/dashboard/onramp/OnrampFormView'
import usFlagSvg from 'helpers/icons/us-flag.svg'
import { useModal } from 'helpers/modalHook'
import { useReadonlyAccount } from 'helpers/useReadonlyAccount'
import { useTranslation } from 'i18n'
import React from 'react'
import { Badge, Box, Flex, Grid, Heading, Image } from 'theme-ui'

import { trackingEvents } from '../../components/analytics/analytics'

const ONRAMPS: OnrampKind[] = [OnrampKind.Wyre, OnrampKind.MoonPay]

function OnrampProviderCard({ onramp }: { onramp: OnrampKind; onClick: () => void }) {
  const { t } = useTranslation('common')
  const openModal = useModal()
  const provider = onramp === OnrampKind.Wyre ? 'wyre' : 'moonpay'

  function openOnramp(onramp: OnrampKind) {
    openModal((props) => <OnrampFormView {...{ ...props, onramp }} />)
  }

  return (
    <CardProduct
      {...{
        icon: <Icon name={provider} size="auto" width="35" height="35" />,
        title: onramp,
        description: t(`${provider}-desc`),
        onClick: () => openOnramp(onramp),
        bottomComponent: (
          <>
            <Flex sx={{ flexDirection: ['column', 'row', 'row'] }}>
              <Badge variant="primary" sx={{ mr: 3, width: 'fit-content' }}>
                {t(`${provider}-badge-limit`)}
              </Badge>
              {onramp === OnrampKind.Wyre && (
                <Badge variant="primary" sx={{ mr: 3, mt: [3, 0, 0], width: 'fit-content' }}>
                  <Flex>
                    <Box sx={{ display: 'inline' }}>
                      <Image src={usFlagSvg} mr={1} />
                    </Box>
                    {t('wyre-badge-country')}
                  </Flex>
                </Badge>
              )}
            </Flex>
          </>
        ),
      }}
    />
  )
}

export default function BuyPage() {
  const { t } = useTranslation('common')
  useReadonlyAccount(true)

  return (
    <Grid gap={4} sx={{ width: '100%' }}>
      <Heading as="h1" sx={{ textAlign: 'center', fontSize: 6 }}>
        {t('choose-provider')}
      </Heading>
      {ONRAMPS.map((onramp) => (
        <OnrampProviderCard
          {...{ onramp, key: onramp }}
          onClick={() => {
            trackingEvents.chooseOnrampProvider(onramp)
          }}
        />
      ))}
    </Grid>
  )
}

BuyPage.layoutProps = {
  backLink: {
    href: '/dashboard',
  },
}
