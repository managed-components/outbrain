import { ComponentSettings, Manager, MCEvent } from '@managed-components/types'

/*
 * What is the source for needing apiVersion, obtpVersion, optOut, bust, and dl?
 * Leaving them in for now, but they may not be necessary.
 */

interface OutbrainParams {
  apiVersion: string
  obtpVersion: string
  optOut: boolean
  bust: string
  dl: string
  ob_click_id?: string | null
  orderId?: string
  orderValue?: string
  currency?: string
  timestamp: string
}

/**
 * Handler for Outbrain events
 * @link https://www.outbrain.com/help/advertisers/server2server-integrations/
 * @param eventType string
 * @param manager Manager
 * @param event MCEvent
 * @param _settings ComponentSettings
 */
export const eventHandler = async (
  eventType: string,
  manager: Manager,
  event: MCEvent,
  _settings: ComponentSettings
) => {
  const { client, payload } = event

  const baseUrl = 'https://tr.outbrain.com/'
  const unifiedPixel = 'unifiedPixel'

  const params: OutbrainParams = {
    apiVersion: '1.1',
    obtpVersion: '1.4.1', // what is this?
    optOut: false,
    bust: Math.random().toString().replace('.', ''),
    dl: encodeURIComponent(client.url.href),
    timestamp: new Date(client.timestamp || new Date())
      .toISOString()
      .replace(/.\d{3}Z$/, ''),
  }

  // First check if clickId is provided directly in the payload
  let clickId = payload.clickId || null

  // If no clickId in payload, check for previously stored click ID from this session
  if (!clickId) {
    clickId = client.get('ob_click_id')

    // If no stored click ID, check for click ID in URL parameters
    if (!clickId) {
      const dlParams = new URLSearchParams(new URL(client.url.href).search)
      // Check for the new parameter name first, then the old one
      if (dlParams.has('OutbrainClickId')) {
        clickId = dlParams.get('OutbrainClickId') ?? undefined
      } else if (dlParams.has('dicbo')) {
        clickId = dlParams.get('dicbo') ?? undefined
      }

      // If we found a click ID, store it for the session
      if (clickId) {
        client.set('ob_click_id', clickId, { scope: 'session' })
      }
    }
  }

  // Add the click ID to the params if we have one
  if (clickId) {
    params['ob_click_id'] = clickId
  }

  // Adds the event name for the conversion
  payload.name = payload.name.replace(/ /g, '-')

  const stringifiedParams = new URLSearchParams({
    ...payload,
    ...params,
  }).toString()

  manager.fetch(`${baseUrl}${unifiedPixel}?${stringifiedParams}`)
}

/*
 * Default handler for Zaraz
 * @link https://managedcomponents.dev/specs/structure
 * @param manager Manager
 * @param settings ComponentSettings
 */
export default async function (manager: Manager, settings: ComponentSettings) {
  manager.addEventListener('pageview', event => {
    eventHandler('pageview', manager, event, settings)
  })
  manager.addEventListener('event', event => {
    eventHandler('event', manager, event, settings)
  })
}
