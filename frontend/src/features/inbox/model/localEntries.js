import { computed } from 'vue'
import '../../../store/postIndex'
import { posts, mentions, parseTags, markMentionRead, tagCounts, unreadMentions } from '../../../store/tagging'

export { unreadMentions }
export const localTags = tagCounts
export const localTaggedEntries = computed(() => posts.value.map(post => ({ key: `post:${post.sourceKey || post.id}`, kind: post.kind, title: post.title, body: post.body, author: post.author, at: post.at, tags: parseTags(post.title + ' ' + post.body), link: post.link, local: true })).filter(item => item.tags.length))
export const localMentionEntries = computed(() => mentions.value.map(item => ({ key: `mention:${item.id}`, mentionId: item.id, kind: item.kind, title: item.title, body: item.excerpt, author: item.from, at: item.at, tags: parseTags(item.title + ' ' + item.excerpt), read: item.read, link: item.link, local: true })))
export function readLocalMention(item) { markMentionRead({ id: item.mentionId }) }
