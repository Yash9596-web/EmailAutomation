import React, { HTMLAttributes } from 'react';
import styles from './Container.module.css';
import { cn } from '@/lib/utils';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(styles.container, className)} {...props} />;
}
