import { SearchIndex } from '../utils/searchIndex.mjs'
const index = new SearchIndex()
self.onmessage = ({ data }) => {
  if (data.type === 'sync') index.sync(data.entries)
  else if (data.type === 'search') self.postMessage({ id: data.id, ...index.search(data.query, data.scope, data.offset, data.limit) })
}
