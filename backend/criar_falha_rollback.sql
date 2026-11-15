CREATE OR REPLACE FUNCTION teste_forcar_erro_progressao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'PROGRESSAO'
       AND NEW."academicTermId" = 'rollback-test-2099' THEN
        RAISE EXCEPTION 'FALHA CONTROLADA: teste de rollback da progressao curricular';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_teste_rollback_progressao
BEFORE INSERT ON academic_history
FOR EACH ROW
EXECUTE FUNCTION teste_forcar_erro_progressao();