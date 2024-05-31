import React from 'react';

const Spinner: React.FC = () => (
  <svg
    width="50"
    height="50"
    viewBox="0 0 50 50"
    xmlns="http://www.w3.org/2000/svg"
    stroke="#ffffff22"
  >
    <g fill="none" fillRule="evenodd">
      <g transform="translate(1 1)" strokeWidth="4">
        <circle strokeOpacity=".5" cx="22" cy="22" r="6"/>
        <path d="M44 22c0-12.15-9.85-22-22-22">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 22 22"
            to="360 22 22"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </g>
  </svg>
);

export default Spinner;
