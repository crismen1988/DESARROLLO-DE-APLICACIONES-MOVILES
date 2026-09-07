DO $$
DECLARE
    categoria_antigua_id INTEGER;
    categoria_nueva_id INTEGER;
BEGIN
    SELECT id INTO categoria_antigua_id
    FROM "categorias"
    WHERE "nombre" = 'Atractivos naturales';

    SELECT id INTO categoria_nueva_id
    FROM "categorias"
    WHERE "nombre" = 'Atractivos turísticos';

    IF categoria_antigua_id IS NOT NULL AND categoria_nueva_id IS NOT NULL THEN
        UPDATE "puntos_interes"
        SET "categoria_id" = categoria_nueva_id
        WHERE "categoria_id" = categoria_antigua_id;

        DELETE FROM "categorias"
        WHERE id = categoria_antigua_id;
    END IF;
END $$;
