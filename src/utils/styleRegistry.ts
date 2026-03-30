// ============================================================
// STYLE REGISTRY + SELECTOR
// Migrated from n8n nodes:
//   • "Dashboard Style Registry"
//   • "Style Selector"
// ============================================================

export interface StyleEntry {
  id: string;
  source: string;
  mood: string;
  theme: 'light' | 'dark';
  layout: string;
  cardStyle: string;
  borderRadius: number;
  shadowLevel: string;
  spacing: string;
  chartDensity: string;
  typographyTone: string;
  headerStyle: string;
  dividerUsage: string;
  backgroundColor: string;
  cardBackground: string;
  headerGradient: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  accentColor: string;
  accentGradient: string;
  chartColors: string[];
  kpiIconStyle: string;
  tabStyle: string;
}

const STYLE_REGISTRY: StyleEntry[] = [
  {
    id: 'powerbi_default', source: 'powerbi', mood: 'corporate-analytical', theme: 'light',
    layout: 'dashboard-grid', cardStyle: 'flat-clean', borderRadius: 4, shadowLevel: 'subtle',
    spacing: 'compact', chartDensity: 'high', typographyTone: 'professional',
    headerStyle: 'solid-brand', dividerUsage: 'minimal',
    backgroundColor: '#F3F2F1', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #217346 0%, #2B9E6A 100%)',
    textColor: '#323130', textMuted: '#605E5C', borderColor: '#EDEBE9',
    accentColor: '#217346', accentGradient: 'linear-gradient(135deg, #217346, #2B9E6A)',
    chartColors: ['#217346', '#0078D4', '#D13438', '#FFB900', '#8764B8', '#00B294'],
    kpiIconStyle: 'minimal', tabStyle: 'underline',
  },
  {
    id: 'azure_analytics', source: 'powerbi', mood: 'executive-analytical', theme: 'light',
    layout: 'metric-focused', cardStyle: 'elevated-subtle', borderRadius: 8, shadowLevel: 'medium',
    spacing: 'comfortable', chartDensity: 'medium', typographyTone: 'corporate',
    headerStyle: 'gradient-blue', dividerUsage: 'subtle',
    backgroundColor: '#F5F8FC', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #0078D4 0%, #106EBE 50%, #005A9E 100%)',
    textColor: '#201F1E', textMuted: '#605E5C', borderColor: '#E1DFDD',
    accentColor: '#0078D4', accentGradient: 'linear-gradient(135deg, #0078D4, #50E6FF)',
    chartColors: ['#0078D4', '#00BCF2', '#7FBA00', '#F25022', '#FFB900', '#737373'],
    kpiIconStyle: 'filled', tabStyle: 'pills-light',
  },
  {
    id: 'executive_dark', source: 'powerbi', mood: 'executive-strategic', theme: 'dark',
    layout: 'kpi-prominent', cardStyle: 'dark-elevated', borderRadius: 8, shadowLevel: 'glow',
    spacing: 'comfortable', chartDensity: 'medium', typographyTone: 'premium',
    headerStyle: 'gradient-dark', dividerUsage: 'accent',
    backgroundColor: '#1B1A19', cardBackground: '#252423',
    headerGradient: 'linear-gradient(135deg, #0078D4 0%, #004578 100%)',
    textColor: '#F3F2F1', textMuted: '#A19F9D', borderColor: '#3B3A39',
    accentColor: '#0078D4', accentGradient: 'linear-gradient(135deg, #0078D4, #00BCF2)',
    chartColors: ['#00BCF2', '#7FBA00', '#F25022', '#FFB900', '#B4A0FF', '#00B294'],
    kpiIconStyle: 'outlined', tabStyle: 'pills-dark',
  },
  {
    id: 'financial_services', source: 'dribbble', mood: 'corporate-executive', theme: 'light',
    layout: 'data-dense', cardStyle: 'bordered-professional', borderRadius: 6, shadowLevel: 'soft',
    spacing: 'compact', chartDensity: 'high', typographyTone: 'formal',
    headerStyle: 'solid-navy', dividerUsage: 'prominent',
    backgroundColor: '#F8F9FA', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #1A365D 0%, #2C5282 100%)',
    textColor: '#1A202C', textMuted: '#718096', borderColor: '#E2E8F0',
    accentColor: '#1A365D', accentGradient: 'linear-gradient(135deg, #1A365D, #2B6CB0)',
    chartColors: ['#1A365D', '#2B6CB0', '#38A169', '#E53E3E', '#D69E2E', '#805AD5'],
    kpiIconStyle: 'minimal', tabStyle: 'boxed',
  },
  {
    id: 'modern_insights', source: 'dribbble', mood: 'modern-analytical', theme: 'light',
    layout: 'card-grid', cardStyle: 'rounded-shadow', borderRadius: 16, shadowLevel: 'medium',
    spacing: 'airy', chartDensity: 'low', typographyTone: 'friendly',
    headerStyle: 'gradient-vibrant', dividerUsage: 'none',
    backgroundColor: '#F7FAFC', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    textColor: '#2D3748', textMuted: '#718096', borderColor: '#E2E8F0',
    accentColor: '#667EEA', accentGradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
    chartColors: ['#667EEA', '#48BB78', '#ED8936', '#F56565', '#38B2AC', '#9F7AEA'],
    kpiIconStyle: 'colorful', tabStyle: 'pills-light',
  },
  {
    id: 'operations_command', source: 'powerbi', mood: 'operational-analytical', theme: 'dark',
    layout: 'dense-metrics', cardStyle: 'flat-dark', borderRadius: 4, shadowLevel: 'none',
    spacing: 'tight', chartDensity: 'very-high', typographyTone: 'technical',
    headerStyle: 'solid-dark', dividerUsage: 'grid-lines',
    backgroundColor: '#11151C', cardBackground: '#1D2330',
    headerGradient: 'linear-gradient(135deg, #F25022 0%, #D13438 100%)',
    textColor: '#E8E6E3', textMuted: '#8A8886', borderColor: '#2D3748',
    accentColor: '#F25022', accentGradient: 'linear-gradient(135deg, #F25022, #FFB900)',
    chartColors: ['#00BCF2', '#7FBA00', '#F25022', '#FFB900', '#E74856', '#9B59B6'],
    kpiIconStyle: 'technical', tabStyle: 'flat',
  },
  {
    id: 'healthcare_analytics', source: 'dribbble', mood: 'analytical-corporate', theme: 'light',
    layout: 'clean-sections', cardStyle: 'soft-rounded', borderRadius: 12, shadowLevel: 'soft',
    spacing: 'comfortable', chartDensity: 'medium', typographyTone: 'clean',
    headerStyle: 'gradient-teal', dividerUsage: 'subtle',
    backgroundColor: '#F0FDFA', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #2DD4BF 100%)',
    textColor: '#134E4A', textMuted: '#5EEAD4', borderColor: '#99F6E4',
    accentColor: '#0D9488', accentGradient: 'linear-gradient(135deg, #0D9488, #2DD4BF)',
    chartColors: ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'],
    kpiIconStyle: 'soft', tabStyle: 'rounded',
  },
  {
    id: 'sales_performance', source: 'powerbi', mood: 'operational-strategic', theme: 'light',
    layout: 'performance-focused', cardStyle: 'accent-border', borderRadius: 8, shadowLevel: 'medium',
    spacing: 'comfortable', chartDensity: 'medium', typographyTone: 'energetic',
    headerStyle: 'gradient-orange', dividerUsage: 'accent-line',
    backgroundColor: '#FFFBEB', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FB923C 100%)',
    textColor: '#78350F', textMuted: '#92400E', borderColor: '#FED7AA',
    accentColor: '#EA580C', accentGradient: 'linear-gradient(135deg, #EA580C, #F97316)',
    chartColors: ['#EA580C', '#0891B2', '#7C3AED', '#059669', '#DC2626', '#2563EB'],
    kpiIconStyle: 'bold', tabStyle: 'boxed',
  },
  {
    id: 'retail_analytics', source: 'dribbble', mood: 'experiential-modern', theme: 'light',
    layout: 'visual-rich', cardStyle: 'glass-light', borderRadius: 20, shadowLevel: 'elegant',
    spacing: 'airy', chartDensity: 'low', typographyTone: 'modern',
    headerStyle: 'gradient-pink', dividerUsage: 'none',
    backgroundColor: '#FDF4FF', cardBackground: 'rgba(255, 255, 255, 0.95)',
    headerGradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 50%, #F472B6 100%)',
    textColor: '#701A75', textMuted: '#A21CAF', borderColor: '#F5D0FE',
    accentColor: '#DB2777', accentGradient: 'linear-gradient(135deg, #DB2777, #EC4899)',
    chartColors: ['#DB2777', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444'],
    kpiIconStyle: 'elegant', tabStyle: 'pills-light',
  },
  {
    id: 'midnight_analytics', source: 'powerbi', mood: 'executive-analytical', theme: 'dark',
    layout: 'executive-grid', cardStyle: 'dark-glass', borderRadius: 12, shadowLevel: 'subtle-dark',
    spacing: 'comfortable', chartDensity: 'medium', typographyTone: 'premium',
    headerStyle: 'gradient-midnight', dividerUsage: 'subtle',
    backgroundColor: '#0F172A', cardBackground: '#1E293B',
    headerGradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    textColor: '#F1F5F9', textMuted: '#94A3B8', borderColor: '#334155',
    accentColor: '#3B82F6', accentGradient: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
    chartColors: ['#3B82F6', '#22D3EE', '#A78BFA', '#34D399', '#FBBF24', '#F87171'],
    kpiIconStyle: 'modern', tabStyle: 'pills-dark',
  },
  {
    id: 'supply_chain', source: 'powerbi', mood: 'operational-analytical', theme: 'light',
    layout: 'data-focused', cardStyle: 'flat-bordered', borderRadius: 4, shadowLevel: 'none',
    spacing: 'compact', chartDensity: 'high', typographyTone: 'technical',
    headerStyle: 'solid-indigo', dividerUsage: 'prominent',
    backgroundColor: '#EEF2FF', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    textColor: '#312E81', textMuted: '#6366F1', borderColor: '#C7D2FE',
    accentColor: '#4338CA', accentGradient: 'linear-gradient(135deg, #4338CA, #6366F1)',
    chartColors: ['#4338CA', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED'],
    kpiIconStyle: 'minimal', tabStyle: 'underline',
  },
  {
    id: 'marketing_dashboard', source: 'dribbble', mood: 'experiential-strategic', theme: 'light',
    layout: 'creative-grid', cardStyle: 'colorful-accent', borderRadius: 16, shadowLevel: 'colorful',
    spacing: 'comfortable', chartDensity: 'medium', typographyTone: 'creative',
    headerStyle: 'gradient-rainbow', dividerUsage: 'colorful',
    backgroundColor: '#FAFAFA', cardBackground: '#FFFFFF',
    headerGradient: 'linear-gradient(135deg, #F472B6 0%, #A78BFA 33%, #60A5FA 66%, #34D399 100%)',
    textColor: '#18181B', textMuted: '#71717A', borderColor: '#E4E4E7',
    accentColor: '#8B5CF6', accentGradient: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
    chartColors: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
    kpiIconStyle: 'colorful', tabStyle: 'rounded-colorful',
  },
];

/** Fisher-Yates shuffle — mirrors n8n's shuffleArray */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Selects one style from the registry using multi-source entropy
 * (mirrors n8n "Style Selector" node).
 */
export function selectStyle(): StyleEntry {
  const shuffled = shuffleArray(STYLE_REGISTRY);
  const r1 = Math.random(), r2 = Math.random(), r3 = Math.random();
  const entropy = ((Date.now() % 100_000) * r1 + r2 * 10_000 + r3 * 1_000) % 1;
  const idx = Math.floor(Math.abs(entropy) * shuffled.length) % shuffled.length;
  const selected = shuffled[idx];
  console.log(`[StyleSelector] Selected: ${selected.id} (theme=${selected.theme})`);
  return selected;
}

export { STYLE_REGISTRY };
