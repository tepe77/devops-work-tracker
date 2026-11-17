import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo({ className = 'h-9 w-auto object-contain', alt = 'DevOps Work Tracker', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo.webp"
            alt={alt}
            className={className}
            {...props}
        />
    );
}

