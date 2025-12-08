import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
        const variants = {
            default: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-lg hover:shadow-xl',
            outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
            ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
            destructive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500',
        };
        const sizes = { sm: 'text-sm px-3 py-1.5', md: 'text-base px-4 py-2', lg: 'text-lg px-6 py-3' };

        return <button ref={ref} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>{children}</button>;
    }
);

Button.displayName = 'Button';
export { Button };
