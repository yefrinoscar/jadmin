-- ============================================================================
-- Migration: Chat System
-- Description: Tables for real-time support chat with AI integration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('active', 'closed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE message_sender_type AS ENUM ('visitor', 'ai', 'agent');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- Chat conversations (visitor info and metadata)
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Visitor info (se recopila durante la conversación)
    visitor_name TEXT DEFAULT 'Usuario' NOT NULL,
    visitor_email TEXT DEFAULT '' NOT NULL,
    visitor_phone TEXT,
    visitor_company TEXT,
    
    -- Status
    status conversation_status DEFAULT 'active',
    needs_human_attention BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    
    -- Assignment (users.id is TEXT - Clerk user ID)
    assigned_to TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Tracking
    source_url TEXT,
    ip_address TEXT,
    user_agent TEXT,
    
    -- Counters
    message_count INTEGER DEFAULT 0,
    ai_message_count INTEGER DEFAULT 0,
    agent_message_count INTEGER DEFAULT 0,
    
    -- Timestamps
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    sender_type message_sender_type NOT NULL,
    
    -- Agent reference (when sender_type = 'agent') - users.id is TEXT
    agent_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- AI metadata
    ai_model TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_email ON public.chat_conversations(visitor_email);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_attention ON public.chat_conversations(needs_human_attention) WHERE needs_human_attention = TRUE;
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Update conversation stats when new message is added
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_conversations
    SET 
        message_count = message_count + 1,
        ai_message_count = CASE WHEN NEW.sender_type = 'ai' THEN ai_message_count + 1 ELSE ai_message_count END,
        agent_message_count = CASE WHEN NEW.sender_type = 'agent' THEN agent_message_count + 1 ELSE agent_message_count END,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_stats ON public.chat_messages;
CREATE TRIGGER trg_update_conversation_stats
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_stats();

-- Update updated_at on conversation changes
DROP TRIGGER IF EXISTS trg_chat_conversations_updated ON public.chat_conversations;
CREATE TRIGGER trg_chat_conversations_updated
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: anyone can create and read (public chat)
DROP POLICY IF EXISTS "chat_conversations_insert" ON public.chat_conversations;
CREATE POLICY "chat_conversations_insert" ON public.chat_conversations
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "chat_conversations_select" ON public.chat_conversations;
CREATE POLICY "chat_conversations_select" ON public.chat_conversations
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "chat_conversations_update" ON public.chat_conversations;
CREATE POLICY "chat_conversations_update" ON public.chat_conversations
    FOR UPDATE USING (TRUE);

-- Messages: anyone can create and read
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
CREATE POLICY "chat_messages_insert" ON public.chat_messages
    FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages
    FOR SELECT USING (TRUE);

-- ----------------------------------------------------------------------------
-- REALTIME
-- ----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
