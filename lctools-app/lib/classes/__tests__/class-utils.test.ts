import { searchClasses, getAllRoles } from '../class-utils';
import type { ClassData, ClassSearchParams } from '../class-utils';

describe('class-utils', () => {
  const sampleClasses: ClassData[] = [
    {
      id: 'warrior',
      name: 'Warrior',
      tier: 1,
      difficulty: 2,
      main_role: 'Striker',
      secondary_role: null,
      image_url: '',
      requirements: { type: 'none', conditions: [] },
      description: 'A melee fighter specialized in damage.',
      guide: '',
      progression: [],
      abilities: [
        { id: 'slash', name: 'Slash', type: 'attack', keywords: ['melee'], range: 'melee', description: 'A quick slash attack.' }
      ],
    },
    {
      id: 'mage',
      name: 'Mage',
      tier: 2,
      difficulty: 4,
      main_role: 'Controller',
      secondary_role: 'Support',
      image_url: '',
      requirements: { type: 'level', conditions: [{ type: 'level', description: 'Requires level 5', value: '5' }] },
      description: 'Master of elemental magic.',
      guide: '',
      progression: [],
      abilities: [
        { id: 'fireball', name: 'Fireball', type: 'spell', keywords: ['ranged'], range: '10m', description: 'Launches a ball of fire.' }
      ],
    }
  ];

  test('getAllRoles returns unique sorted roles', () => {
    const roles = getAllRoles(sampleClasses);
    expect(roles).toEqual(['Controller', 'Striker', 'Support']);
  });

  test('searchClasses filters by text search across multiple fields', () => {
    const params: ClassSearchParams = { search: 'elemental' };
    const results = searchClasses(sampleClasses, params);
    expect(results).toEqual([sampleClasses[1]]);

    const abilitySearch: ClassSearchParams = { search: 'slash' };
    const abilityResults = searchClasses(sampleClasses, abilitySearch);
    expect(abilityResults).toEqual([sampleClasses[0]]);
  });

  test('searchClasses filters by tier', () => {
    const params: ClassSearchParams = { tier: [1] };
    const results = searchClasses(sampleClasses, params);
    expect(results).toEqual([sampleClasses[0]]);
  });

  test('searchClasses filters by mainRole and secondaryRole', () => {
    const params1: ClassSearchParams = { mainRole: 'Controller' };
    expect(searchClasses(sampleClasses, params1)).toEqual([sampleClasses[1]]);

    const params2: ClassSearchParams = { secondaryRole: 'None' };
    expect(searchClasses(sampleClasses, params2)).toEqual([sampleClasses[0]]);
  });

  test('searchClasses filters by difficulty', () => {
    const params: ClassSearchParams = { difficulty: [4] };
    const results = searchClasses(sampleClasses, params);
    expect(results).toEqual([sampleClasses[1]]);
  });
});