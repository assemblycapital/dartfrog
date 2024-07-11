
export const HamburgerIcon = ({ width = '24', height = '24', color = 'black' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect y="4" width="24" height="2" fill={color} />
    <rect y="11" width="24" height="2" fill={color} />
    <rect y="18" width="24" height="2" fill={color} />
  </svg>
);