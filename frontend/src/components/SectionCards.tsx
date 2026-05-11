import { sectionDefinitions } from '../constants/dashboard'
import type { SectionKey, SectionState } from '../types/config'

type SectionCardsProps = {
  isGlobalSearch: boolean
  onSectionSelect: (section: SectionKey) => void
  sections: Record<SectionKey, SectionState>
  selectedSection: SectionKey
}

export function SectionCards({
  isGlobalSearch,
  onSectionSelect,
  sections,
  selectedSection,
}: SectionCardsProps) {
  return (
    <section className="section-card-grid" aria-label="설정 섹션 요약">
      {sectionDefinitions.map((section) => (
        <button
          key={section.label}
          type="button"
          className={section.label === selectedSection && !isGlobalSearch ? 'section-card active' : 'section-card'}
          onClick={() => onSectionSelect(section.label)}
        >
          <span>{section.label}</span>
          <strong>{sections[section.label].total}</strong>
        </button>
      ))}
    </section>
  )
}
