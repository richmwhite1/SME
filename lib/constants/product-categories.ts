/**
 * Product Categorization Constants
 * Defines the dual-tier categorization system for products
 */

export const PRIMARY_CATEGORIES = [
    'Foundational Health',
    'Targeted Support',
    'Lifestyle & Performance',
    'Specialized Needs'
] as const;

export type PrimaryCategory = typeof PRIMARY_CATEGORIES[number];

export const PRIMARY_CATEGORY_DESCRIPTIONS: Record<PrimaryCategory, string> = {
    'Foundational Health': 'Essential nutrients and compounds that support baseline health and fill nutritional gaps',
    'Targeted Support': 'Products designed to address specific health conditions or systems',
    'Lifestyle & Performance': 'Products that enhance physical or cognitive performance and support active lifestyles',
    'Specialized Needs': 'Products for specific populations, diets, or unique health situations'
};

// Secondary Categories organized by type
export const HEALTH_CONDITIONS = [
    'Anxiety & Stress',
    'Depression',
    'Insomnia',
    'Brain Fog',
    'Chronic Fatigue',
    'Digestive Issues',
    'IBS',
    'Inflammation',
    'Joint Pain',
    'Arthritis',
    'High Blood Pressure',
    'High Cholesterol',
    'Blood Sugar Imbalance',
    'Hormonal Imbalance',
    'PCOS',
    'Menopause',
    'Low Testosterone',
    'Thyroid Issues',
    'Autoimmune Conditions',
    'Skin Issues',
    'Hair Loss',
    'Allergies'
] as const;

export const HEALTH_GOALS = [
    'Weight Loss',
    'Muscle Gain',
    'Athletic Performance',
    'Endurance',
    'Recovery',
    'Mental Clarity',
    'Focus & Concentration',
    'Memory Enhancement',
    'Stress Management',
    'Better Sleep',
    'Energy Boost',
    'Detoxification',
    'Anti-Aging',
    'Longevity',
    'Immune Support',
    'Gut Health',
    'Heart Health',
    'Bone Health',
    'Skin Health'
] as const;

export const KEY_INGREDIENTS = [
    'Magnesium',
    'Vitamin D',
    'Omega-3',
    'Probiotics',
    'Collagen',
    'Creatine',
    'Ashwagandha',
    'Rhodiola',
    'Lion\'s Mane',
    'Cordyceps',
    'Reishi',
    'Turmeric/Curcumin',
    'CoQ10',
    'NAD+/NMN',
    'Resveratrol',
    'Berberine',
    'Glutathione',
    'Alpha-Lipoic Acid',
    'L-Theanine',
    '5-HTP',
    'GABA',
    'Melatonin',
    'Zinc',
    'Iron',
    'B-Complex',
    'Vitamin C',
    'Quercetin',
    'Elderberry',
    'Ginger',
    'Milk Thistle',
    'DIM'
] as const;

export const PRODUCT_FORMS = [
    'Capsule',
    'Tablet',
    'Softgel',
    'Powder',
    'Liquid',
    'Gummy',
    'Sublingual',
    'Topical',
    'Spray',
    'Patch',
    'Injection'
] as const;

export type HealthCondition = typeof HEALTH_CONDITIONS[number];
export type HealthGoal = typeof HEALTH_GOALS[number];
export type KeyIngredient = typeof KEY_INGREDIENTS[number];
export type ProductForm = typeof PRODUCT_FORMS[number];

export interface SecondaryCategories {
    conditions: HealthCondition[];
    goals: HealthGoal[];
    ingredients: KeyIngredient[];
    forms: ProductForm[];
}

export const EMPTY_SECONDARY_CATEGORIES: SecondaryCategories = {
    conditions: [],
    goals: [],
    ingredients: [],
    forms: []
};

// Helper function to get all secondary category options grouped
export const SECONDARY_CATEGORY_OPTIONS = {
    conditions: HEALTH_CONDITIONS,
    goals: HEALTH_GOALS,
    ingredients: KEY_INGREDIENTS,
    forms: PRODUCT_FORMS
} as const;

// Helper function to get display labels for secondary category types
export const SECONDARY_CATEGORY_TYPE_LABELS = {
    conditions: 'Health Conditions',
    goals: 'Health Goals',
    ingredients: 'Key Ingredients',
    forms: 'Product Forms'
} as const;
