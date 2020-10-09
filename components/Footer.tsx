import { AppLink } from 'components/Links'
import moment from 'moment'
import getConfig from 'next/config'
import React from 'react'
import { Box, Button, Container, Grid, Link, Text } from 'theme-ui'

const {
  publicRuntimeConfig: { buildHash, buildDate },
} = getConfig()

const FOOTER_LINKS = [
  { labelKey: 'landing.footer.trade', url: 'https://oasis.app/trade' },
  { labelKey: 'landing.footer.borrow', url: 'https://oasis.app/borrow' },
  { labelKey: 'landing.footer.privacy', url: 'https://oasis.app/privacy' },
  { labelKey: 'landing.footer.terms', url: 'https://oasis.app/terms' },
  { labelKey: 'landing.footer.blog', url: 'https://blog.oasis.app' },
  { labelKey: 'landing.footer.contact', url: '/contact' },
]

export function Footer() {
  return (
    <Box as="footer">
      <Container sx={{ maxWidth: '658px', mb: 5, pt: 2 }}>
        <Grid
          columns={[3, 6]}
          as="ul"
          sx={{ pl: 0, justifyContent: 'space-between', textAlign: 'center' }}
        >
          {FOOTER_LINKS.map(({ labelKey, url }) => (
            <Box key={labelKey} as="li" sx={{ listStyle: 'none', fontWeight: 'semiBold' }}>
              <AppLink variant="nav" href={url}>
                {labelKey}
              </AppLink>
            </Box>
          ))}
        </Grid>
      </Container>
      <TemporaryFooter />
    </Box>
  )
}
