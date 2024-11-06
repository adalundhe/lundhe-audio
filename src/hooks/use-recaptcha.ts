
import { env } from '~/env'
import { useEffect, useState } from 'react'

const showBadge = () => {
  if (!window.grecaptcha) return
  window.grecaptcha.ready(() => {
    const badge = document.getElementsByClassName('grecaptcha-badge')[0] as HTMLElement
    if (!badge) return
    badge.style.display = 'block'
    badge.style.zIndex = '1'
  })
}

const hideBadge = () => {
  if (!window.grecaptcha) return
  window.grecaptcha.ready(() => {
    const badge = document.getElementsByClassName('grecaptcha-badge')[0] as HTMLElement
    if (!badge) return
    badge.style.display = 'none'
  })
}

const useReCaptcha = (): { reCaptchaLoaded: boolean; generateReCaptchaToken: (action: string) => Promise<string> } => {
  const [reCaptchaLoaded, setReCaptchaLoaded] = useState(false)

  // Load ReCaptcha script
  useEffect(() => {
    if (typeof window === 'undefined' || reCaptchaLoaded) return
    if (window.grecaptcha) {
      showBadge()
      setReCaptchaLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.google.com/recaptcha/api.js?render=${env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}`
    script.addEventListener('load', () => {
      setReCaptchaLoaded(true)
      showBadge()
    })
    document.body.appendChild(script)
  }, [reCaptchaLoaded])

  // Get token
  const generateReCaptchaToken = async (action: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!reCaptchaLoaded) return reject(new Error('ReCaptcha not loaded'))
      if (typeof window === 'undefined' || !window.grecaptcha) {
        setReCaptchaLoaded(false)
        return reject(new Error('ReCaptcha not loaded'))
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY, { action }).then((token: string) => {
          resolve(token)
        })
      })
    })
  }

  return { reCaptchaLoaded, generateReCaptchaToken }
}

export {
    useReCaptcha
}