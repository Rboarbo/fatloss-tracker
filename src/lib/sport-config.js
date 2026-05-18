export const SPORT_CONFIG = {
  rust:              { label: 'Rust',           color: '#525252', icon: 'Moon' },
  milon:             { label: 'Milon',          color: '#FF6B1A', icon: 'Dumbbell' },
  'padel-training':  { label: 'Padel training', color: '#60a5fa', icon: 'Target' },
  'padel-wedstrijd': { label: 'Padel match',    color: '#a78bfa', icon: 'Trophy' },
  mtb:               { label: 'MTB',            color: '#34d399', icon: 'Bike' },
  wandelen:          { label: 'Wandelen',       color: '#94a3b8', icon: 'Footprints' },
  taichi:            { label: 'Tai Chi',        color: '#22d3ee', icon: 'Wind' },
  anders:            { label: 'Anders',         color: '#737373', icon: 'MoreHorizontal' },
}

export const WEEKLY_PROTOCOL = {
  1: 'milon',
  2: 'wandelen',
  3: 'milon',
  4: 'padel-training',
  5: 'rust',
  6: 'padel-wedstrijd',
  0: 'mtb',
}

// Which optional workout fields to show per training type
export const WORKOUT_FIELDS = {
  rust:              [],
  anders:            [],
  milon:             ['duration', 'trainingKcal', 'notes'],
  'padel-training':  ['duration', 'trainingKcal', 'avgHR', 'notes'],
  'padel-wedstrijd': ['duration', 'trainingKcal', 'avgHR', 'notes'],
  mtb:               ['duration', 'trainingKcal', 'avgHR', 'distance', 'notes'],
  wandelen:          ['duration', 'notes'],
  taichi:            ['duration', 'notes'],
}

export function sportLabel(type) {
  return SPORT_CONFIG[type]?.label ?? type
}

export function sportColor(type) {
  return SPORT_CONFIG[type]?.color ?? '#94a3b8'
}
