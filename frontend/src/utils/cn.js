// Utility function for combining class names
// Similar to clsx/classnames but simpler

export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}

export default cn;
