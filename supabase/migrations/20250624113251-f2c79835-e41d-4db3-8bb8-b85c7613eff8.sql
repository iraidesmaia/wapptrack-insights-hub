
-- Criar tabela para configurações globais de palavras-chave
CREATE TABLE public.global_keywords_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  conversion_keywords TEXT[] NOT NULL DEFAULT ARRAY[
    'obrigado pela compra',
    'obrigada pela compra', 
    'venda confirmada',
    'pedido aprovado',
    'parabéns pela aquisição',
    'compra realizada',
    'vendido',
    'venda fechada',
    'negócio fechado',
    'parabéns pela compra',
    'obrigado por comprar',
    'obrigada por comprar',
    'sua compra foi',
    'compra efetuada',
    'pedido confirmado'
  ],
  cancellation_keywords TEXT[] NOT NULL DEFAULT ARRAY[
    'compra cancelada',
    'pedido cancelado',
    'cancelamento',
    'desistiu da compra',
    'não quer mais',
    'mudou de ideia',
    'cancelar pedido',
    'estorno',
    'devolver',
    'não conseguiu pagar'
  ],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS
ALTER TABLE public.global_keywords_settings ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias configurações
CREATE POLICY "Users can view their own global keywords settings" 
  ON public.global_keywords_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias configurações
CREATE POLICY "Users can create their own global keywords settings" 
  ON public.global_keywords_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias configurações
CREATE POLICY "Users can update their own global keywords settings" 
  ON public.global_keywords_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Criar índice único para evitar múltiplas configurações por usuário
CREATE UNIQUE INDEX idx_global_keywords_settings_user_id ON public.global_keywords_settings(user_id);

-- Função para aplicar configurações globais a uma campanha específica
CREATE OR REPLACE FUNCTION public.apply_global_keywords_to_campaign(campaign_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  global_settings RECORD;
BEGIN
  -- Buscar configurações globais do usuário
  SELECT conversion_keywords, cancellation_keywords 
  INTO global_settings
  FROM public.global_keywords_settings 
  WHERE user_id = auth.uid();
  
  -- Se encontrou configurações globais, aplicar à campanha
  IF FOUND THEN
    UPDATE public.campaigns 
    SET 
      conversion_keywords = global_settings.conversion_keywords,
      cancellation_keywords = global_settings.cancellation_keywords
    WHERE id = campaign_id_param AND user_id = auth.uid();
  END IF;
END;
$$;

-- Trigger para aplicar configurações globais automaticamente em novas campanhas
CREATE OR REPLACE FUNCTION public.auto_apply_global_keywords()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  global_settings RECORD;
BEGIN
  -- Buscar configurações globais do usuário
  SELECT conversion_keywords, cancellation_keywords 
  INTO global_settings
  FROM public.global_keywords_settings 
  WHERE user_id = NEW.user_id;
  
  -- Se encontrou configurações globais, aplicar à nova campanha
  IF FOUND THEN
    NEW.conversion_keywords := global_settings.conversion_keywords;
    NEW.cancellation_keywords := global_settings.cancellation_keywords;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que aplica configurações globais em novas campanhas
CREATE TRIGGER trigger_auto_apply_global_keywords
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_apply_global_keywords();
