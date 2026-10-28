import fs from 'fs';
import path from 'path';
import enTranslation from './en/translation.json';

// Compile-time safety mappings for nesting keys (e.g. "errors.unauthorized")
export type TranslationKeys = Leaves<typeof enTranslation>;

type Leaves<T> = T extends object
    ? { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T]
    : '';

type Join<K, P> = K extends string | number
    ? P extends string | number
    ? P extends ''
    ? `${K}`
    : `${K}.${P}`
    : never
    : never;

// Cache loaded dictionaries in memory for high-throughput API endpoints
const localesCache: Record<string, any> = {
    en: enTranslation,
};

/**
 * Backend Translation engine.
 * Dynamically resolves translations based on target locale fallback strings.
 */
export function t(key: TranslationKeys, locale: string = 'en'): string {
    // Lazy load alternative translation JSON tracks dynamically if not cached
    if (!localesCache[locale]) {
        try {
            const filePath = path.join(__dirname, `./${locale}/translation.json`);
            if (fs.existsSync(filePath)) {
                localesCache[locale] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } else {
                localesCache[locale] = enTranslation; // Fallback
            }
        } catch {
            localesCache[locale] = enTranslation;
        }
    }

    const dictionary = localesCache[locale] || enTranslation;
    const keys = key.split('.');
    let current: any = dictionary;

    for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
            current = current[k];
        } else {
            // Fallback lookup step directly to English source branch if locale is missing keys
            return fallbackToEnglish(key);
        }
    }

    return typeof current === 'string' ? current : key;
}

function fallbackToEnglish(key: string): string {
    const keys = key.split('.');
    let current: any = enTranslation;
    for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
            current = current[k];
        } else {
            return key;
        }
    }
    return typeof current === 'string' ? current : key;
}
