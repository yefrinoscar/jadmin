-- ============================================================================
-- Migration: Chat Handoff System
-- Description: Add managed_by field for AI/Human handoff and collected_info JSONB
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM: Who manages the conversation (AI or Human)
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE conversation_manager AS ENUM ('ai', 'human');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- ALTER TABLE: Add new columns to chat_conversations
-- ----------------------------------------------------------------------------

-- managed_by: Define quién maneja actualmente la conversación
-- Por defecto inicia en 'ai' (la IA actúa como recepcionista)
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS managed_by conversation_manager DEFAULT 'ai';

-- collected_info: JSONB para almacenar información recopilada por la IA
-- Estructura esperada: { name: string, email: string, reason: string, phone?: string }
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS collected_info JSONB DEFAULT '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- INDEX: Para filtrar rápidamente por managed_by
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_chat_conversations_managed_by 
ON public.chat_conversations(managed_by);

-- Index para búsqueda en collected_info (GIN para JSONB)
CREATE INDEX IF NOT EXISTS idx_chat_conversations_collected_info 
ON public.chat_conversations USING GIN (collected_info);

-- ----------------------------------------------------------------------------
-- FUNCIÓN: Trigger para handoff automático cuando un agente envía mensaje
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auto_handoff_to_human()
RETURNS TRIGGER AS $$
BEGIN
    -- Si un agente envía un mensaje, cambiar managed_by a 'human'
    IF NEW.sender_type = 'agent' THEN
        UPDATE public.chat_conversations
        SET 
            managed_by = 'human',
            needs_human_attention = FALSE,
            updated_at = NOW()
        WHERE id = NEW.conversation_id
        AND managed_by = 'ai'; -- Solo si estaba en modo IA
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para auto-handoff
DROP TRIGGER IF EXISTS trg_auto_handoff_to_human ON public.chat_messages;
CREATE TRIGGER trg_auto_handoff_to_human
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_handoff_to_human();

-- ----------------------------------------------------------------------------
-- COMENTARIOS
-- ----------------------------------------------------------------------------

COMMENT ON COLUMN public.chat_conversations.managed_by IS 
'Define quién maneja la conversación: ai (bot recepcionista) o human (agente de soporte)';

COMMENT ON COLUMN public.chat_conversations.collected_info IS 
'Información recopilada por la IA: { name, email, reason, phone?, company? }';

-- ----------------------------------------------------------------------------
-- MIGRAR DATOS EXISTENTES (si hay conversaciones activas)
-- ----------------------------------------------------------------------------

-- Conversaciones donde ya hay mensajes de agente -> marcar como 'human'
UPDATE public.chat_conversations c
SET managed_by = 'human'
WHERE EXISTS (
    SELECT 1 FROM public.chat_messages m 
    WHERE m.conversation_id = c.id 
    AND m.sender_type = 'agent'
)
AND c.managed_by = 'ai';

-- Conversaciones resueltas -> marcar como 'human' (ya fueron atendidas)
UPDATE public.chat_conversations
SET managed_by = 'human'
WHERE is_resolved = TRUE
AND managed_by = 'ai';

