import Head from 'next/head'
import React from 'react'
import { useThemeUI } from 'theme-ui'

export function HeadTags() {
  const { theme } = useThemeUI()
  // @ts-ignore
  const fontLinkHref = theme.metadata && theme.metadata.fontLinkHref

  return (
    <Head>
      {fontLinkHref && <link href={fontLinkHref} rel="stylesheet" />}
      <link rel="shortcut icon" href="/static/favicon.ico" />
    </Head>
  )
}

export function EmbedTwitter() {
  return (
    <Head>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.twttr = (function(d, s, id) {
              var js, fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
              if (d.getElementById(id)) return t;
              js = d.createElement(s);
              js.id = id;
              js.src = "https://platform.twitter.com/widgets.js";
              fjs.parentNode.insertBefore(js, fjs);

              t._e = [];
              t.ready = function(f) {
                t._e.push(f);
              };
              return t;
            }(document, "script", "twitter-wjs"))`,
        }}
      />
    </Head>
  )
}
