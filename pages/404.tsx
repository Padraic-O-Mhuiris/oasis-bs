import { AppLink } from 'components/Links'
import React from 'react'
import { Button, Container, Grid } from 'theme-ui'

export default function NotFoundPage() {
  return (
    <Container>
      <Grid gap={4} sx={{ justifyContent: 'center', textAlign: 'center', mt: 5 }}>
        <AppLink href="/">
          <Button>404'd : -> /</Button>
        </AppLink>
      </Grid>
    </Container>
  )
}
