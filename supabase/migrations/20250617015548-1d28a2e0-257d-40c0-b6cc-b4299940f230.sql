
-- Criar tabela para armazenar instâncias do WhatsApp por usuário
CREATE TABLE public.whatsapp_instances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL UNIQUE,
    instance_token TEXT,
    status TEXT NOT NULL DEFAULT 'QRCODE_WAITING',
    qrcode_base64 TEXT,
    phone_number TEXT,
    user_name_wpp TEXT
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias instâncias
CREATE POLICY "Users can view their own WhatsApp instances" 
    ON public.whatsapp_instances 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias instâncias
CREATE POLICY "Users can create their own WhatsApp instances" 
    ON public.whatsapp_instances 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias instâncias
CREATE POLICY "Users can update their own WhatsApp instances" 
    ON public.whatsapp_instances 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias instâncias
CREATE POLICY "Users can delete their own WhatsApp instances" 
    ON public.whatsapp_instances 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Índice para melhorar performance
CREATE INDEX idx_whatsapp_instances_user_id ON public.whatsapp_instances(user_id);
CREATE INDEX idx_whatsapp_instances_instance_name ON public.whatsapp_instances(instance_name);
