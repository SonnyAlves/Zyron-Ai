-- =============================================================================
-- ZYRON AI - ROW LEVEL SECURITY POLICIES
-- Version: 1.0.0
-- Description: Security policies to ensure users can only access their own data
-- =============================================================================

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES: users table
-- Description: Users can only read/update their own profile
-- =============================================================================

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role to insert (triggered by auth.users insert)
CREATE POLICY "Service role can insert users"
    ON public.users
    FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- POLICIES: chat_sessions table
-- Description: Users can CRUD their own chat sessions
-- =============================================================================

-- Allow users to view their own sessions
CREATE POLICY "Users can view their own chat sessions"
    ON public.chat_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create their own sessions
CREATE POLICY "Users can create their own chat sessions"
    ON public.chat_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own chat sessions"
    ON public.chat_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own sessions
CREATE POLICY "Users can delete their own chat sessions"
    ON public.chat_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- POLICIES: messages table
-- Description: Users can CRUD messages in their own sessions
-- =============================================================================

-- Allow users to view messages from their own sessions
CREATE POLICY "Users can view messages from their own sessions"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow users to create messages in their own sessions
CREATE POLICY "Users can create messages in their own sessions"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Function to check if user owns a session
CREATE OR REPLACE FUNCTION public.user_owns_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_sessions
        WHERE id = session_uuid
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's session count
CREATE OR REPLACE FUNCTION public.get_user_session_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.chat_sessions
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON POLICY "Users can view their own profile" ON public.users IS 'Allows users to read their own profile data';
COMMENT ON POLICY "Users can view their own chat sessions" ON public.chat_sessions IS 'Allows users to view only their own chat sessions';
COMMENT ON POLICY "Users can view messages from their own sessions" ON public.messages IS 'Allows users to view messages only from sessions they own';
COMMENT ON FUNCTION public.user_owns_session IS 'Helper function to check if current user owns a session';
