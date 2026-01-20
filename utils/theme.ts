import { event } from '#src/utils/event';

export type Theme = 'light' | 'dark' | 'system';

// Parse theme from cookie
export function getTheme(): Theme {
    const cookies = event.headers?.cookie || event.headers?.Cookie || '';
    const match = cookies.match(/theme=(light|dark|system)/);
    return (match?.[1] as Theme) || 'system';
}

// Get the class to add to <html> based on theme preference
export function getThemeClass(): string {
    const theme = getTheme();
    if (theme === 'light') return 'light';
    if (theme === 'dark') return 'dark';
    return ''; // system = no class, uses prefers-color-scheme
}

// Get the next theme in the cycle: system -> light -> dark -> system
export function getNextTheme(current: Theme): Theme {
    if (current === 'system') return 'light';
    if (current === 'light') return 'dark';
    return 'system';
}

// Get display label for current theme
export function getThemeLabel(theme: Theme): string {
    if (theme === 'light') return '☀️ Light';
    if (theme === 'dark') return '🌙 Dark';
    return '🖥️ System';
}
