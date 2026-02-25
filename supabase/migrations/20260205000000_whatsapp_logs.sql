-- WhatsApp message generation logs
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  buyer_phone TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('payment_pending', 'payment_confirmed', 'order_shipped', 'order_delivered', 'custom')),
  generated_message TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'hi', 'auto')),
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_whatsapp_logs_seller ON public.whatsapp_logs(seller_id);
CREATE INDEX idx_whatsapp_logs_order ON public.whatsapp_logs(order_id);
CREATE INDEX idx_whatsapp_logs_created ON public.whatsapp_logs(created_at DESC);

-- RLS policies
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own logs"
  ON public.whatsapp_logs FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (seller_id = auth.uid());

COMMENT ON TABLE public.whatsapp_logs IS 'Logs for AI-generated WhatsApp messages via Kimi API';
