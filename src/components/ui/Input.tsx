import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <input
            ref={ref}
            id={id}
            className={cn(
                'w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                error && 'border-red-500 focus:ring-red-500',
                className
            )}
            {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
));

Input.displayName = 'Input';
export { Input };
