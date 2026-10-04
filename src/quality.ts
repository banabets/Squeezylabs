// Phones and tablets get a lighter render: lower resolution, smaller shadow map, no screen-space
// ambient occlusion or SMAA, fewer leaves and a simpler water surface. Decided once at startup.
export const LOW = typeof window !== 'undefined' && (matchMedia('(pointer: coarse)').matches || innerWidth < 820);
