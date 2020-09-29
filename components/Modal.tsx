import { Global } from '@emotion/core'
// @ts-ignore
import { Icon } from '@makerdao/dai-ui-icons'
import { ModalProps } from 'helpers/modalHook'
import { WithChildren } from 'helpers/types'
import React, { useCallback, useEffect } from 'react'
import { TRANSITIONS } from 'theme'
import { Box, Button, Card, Container, Flex, IconButton, SxStyleProp } from 'theme-ui'

interface ModalCloseIconProps extends ModalProps<WithChildren> {
  sx?: SxStyleProp
  size?: number
  color?: string
}

export function ModalCloseIcon({ close, sx, size = 26, color = 'onSurface' }: ModalCloseIconProps) {
  const handleEscClose = useCallback((event) => {
    const { keyCode } = event
    if (keyCode === 27) {
      close()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleEscClose)
    return () => {
      window.removeEventListener('keydown', handleEscClose)
    }
  }, [])

  return (
    <IconButton
      onClick={close}
      sx={{
        cursor: 'pointer',
        height: 4,
        width: 4,
        padding: 0,
        position: 'absolute',
        top: 3,
        right: 3,
        zIndex: 1,
        transition: TRANSITIONS.global,
        color,
        '&:hover': {
          color: 'primary',
        },
        ...sx,
      }}
    >
      <Icon name="close_squared" size={size} />
    </IconButton>
  )
}

export function ModalBackIcon({ back }: { back: () => void }) {
  return (
    <Box sx={{ position: 'absolute', top: 4, left: 4 }}>
      <IconButton onClick={back} sx={{ cursor: 'pointer' }}>
        <Icon name="arrow_left" color="onSurface" size="auto" width="32" height="47" />
      </IconButton>
    </Box>
  )
}

function ModalWrapper({ children }: WithChildren) {
  return (
    <Box
      sx={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        zIndex: 1,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'block',
        bg: '#00000080',
      }}
    >
      <Global
        styles={{
          body: {
            overflow: 'hidden',
          },
        }}
      />
      {children}
    </Box>
  )
}

export function Modal({ children, variant }: ModalProps) {
  return (
    <ModalWrapper>
      <Flex
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          overflow: 'auto',
        }}
      >
        <Container variant={variant || 'modalHalf'} m="auto" py={2}>
          <Card p={0} sx={{ position: 'relative' }}>
            {children}
          </Card>
        </Container>
      </Flex>
    </ModalWrapper>
  )
}

export function ModalBottom({ children, close }: WithChildren & { close: () => void }) {
  return (
    <ModalWrapper>
      <Flex
        sx={{
          height: '100%',
          width: '100%',
          justifyContent: 'center',
          alignItems: ['flex-end', 'flex-end', 'center'],
          overflow: 'auto',
        }}
      >
        <Container variant="modal" m={[0, 0, 'auto']} p={0} py={[0, 0, 2]}>
          <Card
            p={0}
            mx={[0, 0, 3]}
            sx={{
              position: 'relative',
              height: ['75vh', '75vh', '100%'],
              borderBottomLeftRadius: [0, 0, 'large'],
              borderBottomRightRadius: [0, 0, 'large'],
              overflow: 'auto',
              display: 'flex',
            }}
          >
            <ModalCloseIcon {...{ close }} sx={{ top: 4, right: 4 }} />
            <Flex
              sx={{
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%',
                pt: 4,
                px: (theme) => theme.sizingsCustom.pxModalBottom,
                pb: 0,
              }}
            >
              {children}
            </Flex>
          </Card>
        </Container>
      </Flex>
    </ModalWrapper>
  )
}

interface ModalButtonProps extends WithChildren {
  onClick?: () => void
  disabled?: boolean
  sx?: SxStyleProp
}

export function ModalButton({ children, onClick, disabled, sx }: ModalButtonProps) {
  return (
    <Button
      variant="primarySquare"
      onClick={onClick}
      disabled={disabled}
      sx={{ width: '100%', my: 4, ...sx }}
    >
      {children}
    </Button>
  )
}
