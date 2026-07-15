import { describe, it, expect } from 'vitest'
import { areaDefaultsFor } from '@/lib/areas'

describe('areaDefaultsFor', () => {
  it('liefert branchenspezifische Defaults, Fallback other', () => {
    expect(areaDefaultsFor('hotel')).toContain('Logis')
    expect(areaDefaultsFor('restaurant')).toContain('Küche')
    expect(areaDefaultsFor('unbekannt')).toEqual(areaDefaultsFor('other'))
    for (const t of ['hotel','restaurant','cafe_bakery','retail','medical','craft','fitness','beauty','consulting','other']) {
      expect(areaDefaultsFor(t).length).toBeGreaterThanOrEqual(2)
    }
  })
})
