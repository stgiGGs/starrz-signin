// STARRZ consent page. Holds no keys: every call goes to the starrz-oauth Supabase function.
const API = 'https://jkephxfnqlioahqdvwcu.supabase.co/functions/v1/starrz-oauth'
const authorizationId = new URLSearchParams(location.search).get('authorization_id')
let session = null // kept in memory only; gone when the tab closes

const $ = (id) => document.getElementById(id)
const status = (text) => { $('status').textContent = text }
const show = (id) => {
  for (const s of document.querySelectorAll('section')) s.hidden = s.id !== id
}

async function call(step, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (session) headers.Authorization = `Bearer ${session}`
  const r = await fetch(`${API}/${step}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error_description || data.msg || data.error || `Request failed (${r.status})`)
  return data
}

function busy(button, on) {
  button.disabled = on
}

async function loadDetails() {
  status('Loading the request...')
  const d = await call('details', { authorization_id: authorizationId })
  if (d.redirect_url && !d.client) {
    // Already approved before: Supabase hands back the redirect straight away.
    location.assign(d.redirect_url)
    return
  }
  $('client-name').textContent = d.client?.name || d.client?.client_name || 'An app'
  let host = ''
  try { host = new URL(d.redirect_uri).host } catch { host = String(d.redirect_uri || 'unknown') }
  $('redirect-host').textContent = host
  $('scopes').textContent = (d.scope || '').trim() || '(none)'
  $('redirect-warning').hidden = host === 'chatgpt.com'
  show('step-consent')
  status('')
}

$('send').addEventListener('click', async (e) => {
  busy(e.target, true)
  try {
    await call('send-code', { email: $('email').value })
    show('step-code')
    status('If that address can use STARRZ Memory, a code is on its way.')
    $('code').focus()
  } catch (err) {
    status(err.message)
  } finally {
    busy(e.target, false)
  }
})

$('verify').addEventListener('click', async (e) => {
  busy(e.target, true)
  try {
    const r = await call('verify', { email: $('email').value, code: $('code').value })
    session = r.session
    await loadDetails()
  } catch (err) {
    status(err.message === 'invalid_code' ? 'That code did not work. Check it and try again.' : err.message)
  } finally {
    busy(e.target, false)
  }
})

async function decide(approve, button) {
  busy(button, true)
  try {
    const r = await call('decide', { authorization_id: authorizationId, approve })
    status(approve ? 'Approved. Returning to the app...' : 'Denied. Returning to the app...')
    location.assign(r.redirect_url)
  } catch (err) {
    status(err.message)
    busy(button, false)
  }
}
$('approve').addEventListener('click', (e) => decide(true, e.target))
$('deny').addEventListener('click', (e) => decide(false, e.target))

if (authorizationId) {
  show('step-email')
  $('email').focus()
} else {
  show('no-request')
}
