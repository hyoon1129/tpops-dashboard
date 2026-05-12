import type { TableValue } from '../types/config'

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const highlightedText = (value: TableValue, keyword: string) => {
  const text = String(value ?? '')
  const normalizedKeyword = keyword.trim()

  if (!normalizedKeyword) {
    return text
  }

  const pattern = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'gi')
  return text.split(pattern).map((part, index) =>
    part.toLowerCase() === normalizedKeyword.toLowerCase()
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : part,
  )
}
