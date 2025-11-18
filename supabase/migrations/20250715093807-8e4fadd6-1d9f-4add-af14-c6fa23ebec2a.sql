-- Create services table for KB&S services/prestations
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'service', -- service, hour, day, etc.
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_company TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, accepted, rejected, converted
  total_amount NUMERIC NOT NULL DEFAULT 0,
  validity_date DATE,
  notes TEXT,
  terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_items table
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL,
  service_id UUID,
  service_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access to services" ON public.services FOR SELECT USING (true);

CREATE POLICY "Allow all operations on quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quote_items" ON public.quote_items FOR ALL USING (true) WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.quote_items 
ADD CONSTRAINT quote_items_quote_id_fkey 
FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

ALTER TABLE public.quote_items 
ADD CONSTRAINT quote_items_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (name, description, unit_price, unit, category) VALUES
('Consultation technique', 'Consultation et audit technique', 150.00, 'heure', 'Conseil'),
('Installation système', 'Installation et configuration de systèmes', 500.00, 'service', 'Installation'),
('Maintenance préventive', 'Maintenance préventive mensuelle', 200.00, 'mois', 'Maintenance'),
('Formation utilisateurs', 'Formation des utilisateurs finaux', 100.00, 'heure', 'Formation'),
('Support technique', 'Support technique à distance', 80.00, 'heure', 'Support');