-- Additive only. Existing owner policies on analyses continue to apply.
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS clocked_checks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS research_notes jsonb NOT NULL DEFAULT '{}'::jsonb;
-- Browser clients must not forge the server's endpoint execution record.
CREATE OR REPLACE FUNCTION public.protect_clocked_checks() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.clocked_checks := '[]'::jsonb;
      NEW.research_notes := '{}'::jsonb;
    ELSE
      NEW.clocked_checks := OLD.clocked_checks;
      NEW.research_notes := OLD.research_notes;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_clocked_checks ON public.analyses;
CREATE TRIGGER protect_clocked_checks BEFORE INSERT OR UPDATE ON public.analyses
FOR EACH ROW EXECUTE FUNCTION public.protect_clocked_checks();
