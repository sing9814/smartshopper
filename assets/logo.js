import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Logo = ({ height = 100, width = 100 }) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 266 261"
      fill="none"
      xmlns="http://www.w3.org/2000/Svg"
    >
      <Path
        d="M83.5469 142.591C83.5469 142.591 93.7772 161.347 116.511 160.778C139.245 160.21 147.77 142.591 147.77 142.591"
        stroke="white"
        strokeWidth="13.6404"
        strokeLinecap="round"
      />
      <Path
        d="M72.7409 89.1657C59.1084 -23.3665 188.123 -19.3877 169.359 89.1663"
        stroke="white"
        strokeWidth="12.5037"
        strokeLinecap="round"
      />
      <Path
        d="M98.3242 75.377C100.598 -16.1277 196.649 -5.32904 194.944 75.377"
        stroke="white"
        strokeWidth="12.5037"
        strokeLinecap="round"
      />
      <Path
        d="M194.025 78.3679H46.4333C40.6903 78.3679 35.8495 82.6516 35.1508 88.3519L16.3402 241.806C15.5097 248.582 20.7964 254.556 27.6228 254.556H196.995C203.359 254.556 208.483 249.332 208.36 242.969L205.39 89.5149C205.27 83.324 200.217 78.3679 194.025 78.3679Z"
        fill="#7C90FF"
        stroke="white"
        strokeWidth="12.5037"
        strokeLinecap="round"
      />
      <Path
        d="M205.5 254.068L232.077 252.665C241.851 252.149 249.185 243.528 248.129 233.798L232.418 89.0767C231.792 83.3076 226.923 78.9365 221.12 78.9365L203 78.9365L205.5 254.068Z"
        fill="#536DFE"
        stroke="white"
        strokeWidth="12.5037"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default Logo;
