import React from 'react';
import { Stars } from 'lucide-react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {

    const sizeClasses = {
        sm: { box: 'w-8 h-8 rounded-lg', icon: 18, text: 'text-lg' },
        md: { box: 'w-10 h-10 rounded-xl', icon: 20, text: 'text-xl' },
        lg: { box: 'w-12 h-12 rounded-xl', icon: 24, text: 'text-2xl' },
        xl: { box: 'w-16 h-16 rounded-2xl', icon: 32, text: 'text-4xl' },
    };

    const s = sizeClasses[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className={`${s.box} bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                <Stars size={s.icon} className="text-white" />
            </div>
            {showText && (
                <span className={`${s.text} font-bold tracking-tight text-white`}>Hiredly</span>
            )}
        </div>
    );
};
