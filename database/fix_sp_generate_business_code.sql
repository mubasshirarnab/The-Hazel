DROP PROCEDURE IF EXISTS sp_generate_business_code;

CREATE PROCEDURE sp_generate_business_code(
    IN p_entity_name VARCHAR(64),
    IN p_prefix VARCHAR(16),
    OUT p_code VARCHAR(64)
)
BEGIN
    DECLARE v_next_number INT UNSIGNED DEFAULT 0;
    DECLARE v_digit_length TINYINT UNSIGNED DEFAULT 6;

    -- No START TRANSACTION / COMMIT here — the caller owns the transaction.
    -- When called from a trigger, wrapping in its own transaction is forbidden (ERROR 1422).

    INSERT INTO tbl_sequences(entity_name, prefix, last_number, digit_length)
    VALUES (p_entity_name, p_prefix, 0, v_digit_length)
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

    SELECT last_number + 1, digit_length
      INTO v_next_number, v_digit_length
      FROM tbl_sequences
     WHERE entity_name = p_entity_name
     FOR UPDATE;

    UPDATE tbl_sequences
       SET last_number = v_next_number,
           updated_at  = CURRENT_TIMESTAMP
     WHERE entity_name = p_entity_name;

    SET p_code = CONCAT(p_prefix, LPAD(v_next_number, v_digit_length, '0'));
END;
