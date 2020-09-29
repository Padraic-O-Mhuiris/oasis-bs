// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { MarketingLayout } from 'components/Layouts'
import { AppLink } from 'components/Links'
import { useTranslation } from 'i18n'
import React, { ReactNode } from 'react'
import { Box, Button, Card, Flex, Grid, Heading, Image, Text } from 'theme-ui'

interface CardLandingProps {
  icon: ReactNode
  cardType: string
  href: string
  as?: string
}

function CardLanding({ icon, cardType, href, as }: CardLandingProps) {
  const { t } = useTranslation()
  const cardTypeLowerCase = cardType.toLowerCase()

  return (
    <Card p={4} sx={{ border: 'none', bg: `backgroundCard${cardType}` }}>
      <Grid gap={3}>
        <Flex sx={{ alignItems: 'center', height: '28px' }}>{icon}</Flex>
        <Heading sx={{ fontSize: 4 }}>{t(`landing.cards.${cardTypeLowerCase}.title`)}</Heading>
        <Text sx={{ lineHeight: '' }}>{t(`landing.cards.${cardTypeLowerCase}.description`)}</Text>
        <Box>
          <AppLink
            href={href}
            as={as}
            sx={{ color: `textCard${cardType}`, fontWeight: 'semiBold', display: 'inline-block' }}
          >
            <Flex sx={{ alignItems: 'center' }}>
              <Text sx={{ mr: 2 }}>{t(`landing.cards.${cardTypeLowerCase}.link_text`)}</Text>
              <Icon name="landing_chevron_right" size="auto" width="7px" height="11px" />
            </Flex>
          </AppLink>
        </Box>
      </Grid>
    </Card>
  )
}

export function SectionDescription({ heading, text }: any) {
  return (
    <Box sx={{ mb: 3 }}>
      <Heading variant="mediumHeading" as="h2" sx={{ mb: 3 }}>
        {heading}
      </Heading>
      <Text sx={{ fontSize: 4, color: 'textAlt', mt: -1 }}>{text}</Text>
    </Box>
  )
}

export default function LandingPage() {
  const { t } = useTranslation()
  return (
    <Box sx={{ width: '100%' }}>
      <Grid
        gap={4}
        columns="1fr"
        sx={{ maxWidth: '600px', mx: 'auto', pb: 4, mb: 2, textAlign: 'center' }}
      >
        <Image
          src="static/img/logo.png"
          sx={{ display: 'block', mx: 'auto', width: 5, height: 5 }}
        />
        <Heading variant="largeHeading" as="h1" sx={{ fontWeight: 'bold', lineHeight: 'loose' }}>
          {t('landing.hero.headline')}
        </Heading>
        <Grid columns={2} sx={{ maxWidth: '340px', width: '100%', mx: 'auto' }}>
          <AppLink href="/guides">
            <Button variant="outline" sx={{ width: '100%' }}>
              {t('landing.hero.button1')}
            </Button>
          </AppLink>
          <AppLink href="/connect" sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button sx={{ width: '90%' }}>{t('landing.hero.button2')}</Button>
          </AppLink>
        </Grid>
      </Grid>
      <Box sx={{ position: 'relative', maxWidth: '700px', mx: 'auto' }}>
        <Box
          sx={{
            position: 'absolute',
            variant: 'gradients.landingPhone',
            alignItems: 'center',
            justifyContent: 'center',
            top: '0',
            width: '100%',
            height: 0,
            pb: '54.5725%',
            borderRadius: 'roundish',
            '@media screen and (max-width: 30em)': {
              pb: '74.5725%',
            },
          }}
        />
        <Image
          src="static/img/landing_phone.png"
          sx={{
            display: 'block',
            mx: 'auto',
            position: 'relative',
            pt: 3,
            maxWidth: ['52%', '100%'],
            minWidth: ['200px', 'auto'],
          }}
        />
      </Box>
      <Grid gap={4} sx={{ maxWidth: '585px', mx: 'auto', pt: 3 }}>
        {[...Array(4).keys()].map((i) => (
          <SectionDescription
            key={i}
            heading={t(`landing.sections.${i + 1}.title`)}
            text={t(`landing.sections.${i + 1}.description`)}
          />
        ))}
      </Grid>
      <Grid columns={[1, 2]} gap={4} mt={5}>
        <CardLanding
          {...{
            cardType: 'Borrow',
            href: 'https://oasis.app/borrow',
            icon: <Icon name="landing_borrow_coins" size="auto" width="47px" height="28px" />,
          }}
        />
        <CardLanding
          {...{
            cardType: 'Wallet',
            as: '/guides/choose-wallet',
            href: '/guides/[slug]',
            icon: <Icon name="landing_wallet" size="auto" width="21px" height="20px" />,
          }}
        />
      </Grid>
    </Box>
  )
}

LandingPage.layout = MarketingLayout
LandingPage.layoutProps = {
  variant: 'landingContainer',
}
LandingPage.theme = 'Landing'
