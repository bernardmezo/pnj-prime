import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn(...inputs) — conditional className joiner with tailwind-merge conflict
 * resolution. Use it everywhere instead of string concatenation so later
 * utilities win (e.g. `cn('p-2', props.className)`).
 *
 * @param {...(string|object|array|false|null|undefined)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default cn;
