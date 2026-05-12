import { sectionDefinitions } from '../constants/dashboard'
import type { SectionKey, SectionState } from '../types/config'

type SectionCardsProps = {
  compact: boolean
  isGlobalSearch: boolean
  onSectionSelect: (section: SectionKey) => void
  sections: Record<SectionKey, SectionState>
  selectedSection: SectionKey
}

export function SectionCards({
  compact,
  isGlobalSearch,
  onSectionSelect,
  sections,
  selectedSection,
}: SectionCardsProps) {
  return (
    <section className={compact ? 'section-card-grid compact' : 'section-card-grid'} aria-label="설정 섹션 요약">
      {sectionDefinitions.map((section) => (
        <button
          key={section.label}
          type="button"
          className={section.label === selectedSection && !isGlobalSearch ? 'section-card active' : 'section-card'}
          onClick={() => onSectionSelect(section.label)}
        >
          <span>{section.label}</span>
          <strong>
            {sections[section.label].loading && sections[section.label].total === 0
              ? '...'
              : sections[section.label].total}
          </strong>
        </button>
      ))}
    </section>
  )
}
