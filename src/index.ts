import { ComponentSettings, Manager, MCEvent } from '@managed-components/types'

interface OutbrainParams {
  apiVersion: string
  obtpVersion: string
  optOut: boolean
  bust: string
  dl: string
  ob_click_id?: string | null
}

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
  }

  // deal with dicbo param
  const dlParams = new URLSearchParams(new URL(client.url.href).search)
  if (dlParams.has('dicbo')) {
    params['ob_click_id'] = dlParams.get('dicbo')
  }

  payload.name = payload.name.replace(/ /g, '-')
  const stringifiedParams = new URLSearchParams({
    ...payload,
    ...params,
  }).toString()

  manager.fetch(`${baseUrl}${unifiedPixel}?${stringifiedParams}`)
}

export default async function (manager: Manager, settings: ComponentSettings) {
  manager.addEventListener('pageview', event => {
    eventHandler('pageview', manager, event, settings)
  })
  manager.addEventListener('event', event => {
    eventHandler('event', manager, event, settings)
  })
}
