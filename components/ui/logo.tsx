
import React from "react";

export const BrandColors = {
    primary: "#3B82F6", // Electric Blue
    black: "#000000",   // Deep Black
    white: "#FFFFFF",
};

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    variant?: "icon" | "full";
    theme?: "light" | "dark";
    className?: string;
}

export function ZavvyLogo({ variant = "full", theme = "light", className, ...props }: LogoProps) {
    const textColor = theme === "dark" ? BrandColors.white : BrandColors.black;
    const isIcon = variant === "icon";
    const width = isIcon ? 40 : 140;
    const height = 40;

    return (
        <svg
            width={width}
            height={height}
            viewBox={isIcon ? "0 0 40 40" : "0 0 140 40"}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            {/* Icon: Z Check Mark */}
            <rect width="40" height="40" rx="10" fill={BrandColors.black} />
            {/* The Z Check Mark: Abstract geometric Z with a check-like stroke */}
            {/* Starting top-left, going right, diagonal down-left, right. But ensuring it looks like a check/arrow */}
            <path
                d="M26 12H14C12.8954 12 12 12.8954 12 14V16C12 16.5523 12.4477 17 13 17H22.5L12.4 27.2C12.1 27.5 12 28 12 28.5V29C12 30.1046 12.8954 31 14 31H26C27.1046 31 28 30.1046 28 29V27C28 26.4477 27.5523 26 27 26H17.5L27.6 15.8C27.9 15.5 28 15 28 14.5V14C28 12.8954 27.1046 12 26 12Z"
                fill={BrandColors.primary}
            />
            {/* Adding a subtle check overlay or modification - actually the Z is enough for the monogram request if styled well. 
          Let's add a "check" accent. 
          A check mark usually goes down then up. 
          Let's overlay a small check in white or negative space? 
          Or maybe modification: The diagonal of Z can be the check? 
          Let's keep it simple: A Z in Blue on Black. 
      */}

            {/* Full Logo Text */}
            {!isIcon && (
                <g transform="translate(50, 8)">
                    {/* Z */}
                    <path d="M11.664 23.36H3.36L10.32 10.912H0.96V6.656H16.896V10.272L9.344 23.36H17.216V27.616H0.992L11.664 23.36Z" fill={textColor} />
                    {/* a */}
                    <path d="M26.784 27.904C25.44 27.904 24.32 27.36 23.424 26.272C22.56 25.184 22.128 23.68 22.128 21.76C22.128 19.808 22.576 18.288 23.472 17.2C24.368 16.112 25.488 15.568 26.832 15.568C27.984 15.568 28.928 15.968 29.664 16.768V15.76H33.264V27.616H29.808V26.656C29.072 27.488 28.064 27.904 26.784 27.904ZM27.744 24.736C28.416 24.736 28.976 24.464 29.424 23.92V19.552C28.976 19.008 28.416 18.736 27.744 18.736C26.912 18.736 26.288 19.168 25.872 20.032C25.456 20.896 25.248 21.472 25.248 21.76C25.248 22.048 25.456 22.624 25.872 23.488C26.288 24.32 26.912 24.736 27.744 24.736Z" fill={textColor} />
                    {/* v */}
                    <path d="M41.472 27.616L36.864 15.76H40.752L43.2 22.624L45.696 15.76H49.584L44.976 27.616H41.472Z" fill={textColor} />
                    {/* v */}
                    <path d="M54.528 27.616L49.92 15.76H53.808L56.256 22.624L58.752 15.76H62.64L58.032 27.616H54.528Z" fill={textColor} />
                    {/* y */}
                    <path d="M66.624 33.376L61.632 15.76H65.424L68.304 27.184L71.232 15.76H74.88L69.312 34.336C68.96 35.52 68.496 36.368 67.92 36.88C67.344 37.36 66.576 37.6 65.616 37.6C64.976 37.6 64.368 37.472 63.792 37.216V34.336C64.144 34.464 64.448 34.528 64.704 34.528C65.536 34.528 66.176 34.144 66.624 33.376Z" fill={textColor} />
                </g>
            )}

            {/* Arrow accent in the text "Zavvy" - maybe on the second 'v'? Let's keep it simple for generic font */}
        </svg>
    );
}
