import { readPreviewState, screens, widths } from './model.mjs'
const byId = (id) => document.getElementById(id)
const state = readPreviewState(location.search)
for (const [path, label] of screens) byId('screen').add(new Option(label, path))
for (const width of widths) byId('width').add(new Option(String(width) + 'px', width))
byId('screen').value = state.route
byId('view').value = state.view
byId('width').value = String(state.width)
function update(reload = false) {
  const params = new URLSearchParams({
    view: byId('view').value, screen: byId('screen').value, width: byId('width').value,
  })
  const next = readPreviewState(params)
  history.replaceState(null, '', '/__preview?' + params)
  for (const kind of ['pc', 'mobile']) {
    const frame = byId(kind + '-frame')
    byId(kind + '-panel').hidden = next.view !== 'both' && next.view !== kind
    if (reload || frame.getAttribute('src') !== next.route) frame.src = next.route
  }
  byId('mobile-frame').width = next.width
  byId('mobile-size').textContent = next.width + ' × 844'
  byId('open-app').href = next.route
  byId('previews').dataset.view = next.view
}
byId('controls').addEventListener('submit', (event) => event.preventDefault())
byId('controls').addEventListener('change', () => update())
byId('reload').addEventListener('click', () => update(true))
update()
