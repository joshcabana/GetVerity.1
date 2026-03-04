
-- delete_my_account RPC: cleans up all public schema data for the authenticated user
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM chemistry_vault_items WHERE user_id = auth.uid();
  DELETE FROM spark_reflections WHERE user_id = auth.uid();
  DELETE FROM messages WHERE sender_id = auth.uid();
  DELETE FROM drop_rsvps WHERE user_id = auth.uid();
  DELETE FROM push_subscriptions WHERE user_id = auth.uid();
  DELETE FROM user_blocks WHERE blocker_id = auth.uid();
  DELETE FROM token_transactions WHERE user_id = auth.uid();
  DELETE FROM user_payment_info WHERE user_id = auth.uid();
  DELETE FROM user_trust WHERE user_id = auth.uid();
  DELETE FROM user_roles WHERE user_id = auth.uid();
  DELETE FROM profiles WHERE user_id = auth.uid();
END;
$$;

-- Add missing DELETE policies
CREATE POLICY "Users can delete own transactions"
ON public.token_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trust"
ON public.user_trust
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment info"
ON public.user_payment_info
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
