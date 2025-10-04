import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function TextField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  description,
  disabled,
  className,
  min,
  max,
  step
}: TextFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`text-right ${error ? 'border-red-500' : ''}`}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'اختر...',
  required,
  error,
  description,
  disabled,
  className
}: SelectFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

interface TextAreaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  error,
  description,
  disabled,
  rows = 3,
  maxLength,
  className
}: TextAreaFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`text-right resize-none ${error ? 'border-red-500' : ''}`}
      />
      {maxLength && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{value.length} / {maxLength}</span>
          {description && <span>{description}</span>}
        </div>
      )}
      {!maxLength && description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

interface SwitchFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SwitchField({
  label,
  name,
  checked,
  onChange,
  required,
  error,
  description,
  disabled,
  className
}: SwitchFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        <Switch
          id={name}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CheckboxField({
  label,
  name,
  checked,
  onChange,
  required,
  error,
  description,
  disabled,
  className
}: CheckboxFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          id={name}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <Label htmlFor={name} className="flex items-center gap-1 cursor-pointer">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mr-6">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 mr-6">{error}</p>
      )}
    </div>
  );
}

interface RadioFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function RadioField({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
  description,
  disabled,
  orientation = 'vertical',
  className
}: RadioFieldProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className={orientation === 'horizontal' ? 'flex flex-wrap gap-4' : ''}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
            <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
            <div className="flex-1">
              <Label htmlFor={`${name}-${option.value}`} className="cursor-pointer">
                {option.label}
              </Label>
              {option.description && (
                <p className="text-sm text-muted-foreground">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Combined form field component that automatically chooses the right field type
interface FormFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'select' | 'textarea' | 'switch' | 'checkbox' | 'radio';
  label: string;
  name: string;
  value: any;
  onChange: (value: any) => void;
  options?: Array<{ value: string; label: string; disabled?: boolean; description?: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  orientation?: 'horizontal' | 'vertical';
}

export function FormField(props: FormFieldProps) {
  switch (props.type) {
    case 'select':
      return (
        <SelectField
          {...props}
          options={props.options || []}
        />
      );
    case 'textarea':
      return (
        <TextAreaField
          {...props}
          rows={props.rows}
          maxLength={props.maxLength}
        />
      );
    case 'switch':
      return (
        <SwitchField
          {...props}
          checked={props.value}
        />
      );
    case 'checkbox':
      return (
        <CheckboxField
          {...props}
          checked={props.value}
        />
      );
    case 'radio':
      return (
        <RadioField
          {...props}
          options={props.options || []}
          orientation={props.orientation}
        />
      );
    default:
      return (
        <TextField
          {...props}
          type={props.type as any}
          min={props.min}
          max={props.max}
          step={props.step}
        />
      );
  }
}