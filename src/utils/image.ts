export const getImageUrl = (src?: string): string => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:image")) return src;
  return `data:image/png;base64,${src}`;
};
