-- Migration: Add missing columns to stores table for multi-tier pricing, active state, and contact info
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS default_price_tier integer NOT NULL DEFAULT 1;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS image_url text;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
