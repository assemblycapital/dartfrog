import * as React from 'react';

interface SpinnerProps {
  size?: string; // Size prop can be in px, em, %, etc.
}

const Spinner: React.FC<SpinnerProps> = ({ size = '50px' }) => (
  <div style={{ width: size, height: size, display: "inline-block" }}> {/* Wrapper div size controlled by props */}
    <svg
      width="100%" // SVG will scale to fill the container
      height="100%"
      viewBox="0 0 50 50" // Fixed viewBox for consistent internal scaling
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
  </div>
);

export default Spinner;
